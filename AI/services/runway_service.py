"""
Runway ML 서비스
Runway ML과의 연동을 담당합니다.
"""

import os
import time
from typing import Dict, Any, List
from dotenv import load_dotenv

try:
    # 런타임에 라이브러리가 없을 수도 있으므로 지연 임포트 처리
    from runwayml import AsyncRunwayML, AuthenticationError
except Exception:  # pragma: no cover - 환경에 따라 optional
    AsyncRunwayML = None  # type: ignore
    AuthenticationError = Exception  # type: ignore


load_dotenv()


class RunwayService:
    """Runway ML 비디오 생성 서비스"""

    def __init__(self) -> None:
        try:
            api_key = os.getenv("RUNWAY_API_KEY")
            base_url = os.getenv("RUNWAY_API_BASE_URL")
            # dev 키를 기본으로 사용할 가능성이 높으므로 기본값을 dev로 둠
            if not base_url:
                base_url = "https://api.dev.runwayml.com"

            if not api_key or AsyncRunwayML is None:
                print("RUNWAY_API_KEY not found or runwayml SDK unavailable, Runway service will be disabled")
                self.client = None
                return

            # base_url을 명시하여 dev/prod 키-엔드포인트 불일치로 인한 401을 방지
            self.api_key = api_key
            self.base_url = base_url
            self.client = AsyncRunwayML(api_key=self.api_key, base_url=self.base_url)
            print(f"Successfully initialized Runway ML client (base_url={self.base_url})")
        except Exception as e:
            print(f"Failed to initialize Runway ML client: {e}")
            self.client = None

    def is_available(self) -> bool:
        """Runway 클라이언트 사용 가능 여부"""
        return self.client is not None

    async def generate_video(
        self,
        enhanced_prompt: str,
        reference_images: List[str],
        model_name: str = "gen4_turbo",
        ratio: str = "720:1280",
        duration_seconds: int = 5,
    ) -> Dict[str, Any]:
        """
        Runway image-to-video로 영상을 생성합니다.

        Args:
            enhanced_prompt: 개선된 텍스트 프롬프트
            reference_images: 참고 이미지 URL 목록(최소 1개 필요)
            model_name: 사용할 Runway 모델명 (기본값: gen4_turbo)
            ratio: 영상 비율 (예: 720:1280)
            duration_seconds: 길이(초) - 5 or 10
        """
        if not self.is_available():
            raise Exception("Runway ML 클라이언트가 초기화되지 않았습니다. RUNWAY_API_KEY를 확인하세요.")

        if not reference_images:
            raise ValueError("Runway 생성에는 최소 1개의 referenceImages가 필요합니다.")

        prompt_image = reference_images[0]

        # 401 발생 시 dev/prod 엔드포인트 자동 전환을 1회 시도 (옵션)
        fallback_enabled = os.getenv("RUNWAY_API_FALLBACK_ENABLED", "false").lower() == "true"
        fallback_base_url = os.getenv("RUNWAY_API_FALLBACK_BASE_URL")

        async def _create_task() -> Any:
            return await self.client.image_to_video.create(  # type: ignore[union-attr]
                model=model_name,
                prompt_image=prompt_image,
                prompt_text=enhanced_prompt,
                ratio=ratio,
                duration=duration_seconds,
            )

        try:
            task = await _create_task()
        except AuthenticationError as auth_err:
            # 키-엔드포인트 불일치 또는 비활성 키일 수 있음
            if not fallback_enabled:
                raise
            # 기본 전환 규칙: dev → prod, prod → dev (또는 지정된 fallback URL)
            target_base = (
                fallback_base_url
                or ("https://api.runwayml.com" if "api.dev.runwayml.com" in getattr(self, "base_url", "") else "https://api.dev.runwayml.com")
            )
            try:
                # 클라이언트 재초기화 후 1회 재시도
                self.client = AsyncRunwayML(api_key=self.api_key, base_url=target_base)  # type: ignore[arg-type]
                self.base_url = target_base
                print(f"[Runway] Authentication failed, retrying with base_url={target_base}")
                task = await _create_task()
            except Exception:
                # 원래 예외를 다시 던져 상위에서 처리
                raise auth_err

        return {
            "id": getattr(task, "id", None),
            "state": getattr(task, "status", "queued"),
            "created_at": time.time(),
        }

    async def wait_for_generation_completion(
        self,
        task_id: str,
        poll_interval_seconds: float = 3.0,
        timeout_seconds: float = 240.0,
    ) -> Dict[str, Any]:
        """Runway 작업 완료까지 폴링합니다."""
        if not self.is_available():
            raise Exception("Runway ML 클라이언트가 초기화되지 않았습니다. RUNWAY_API_KEY 환경변수를 설정하세요.")

        import asyncio

        start = time.time()
        last_status = None
        while time.time() - start < timeout_seconds:
            task = await self.client.tasks.retrieve(id=task_id)  # type: ignore[union-attr]
            status = getattr(task, "status", None)
            if status != last_status:
                last_status = status
                print(f"[Runway] task {task_id} status: {status}")

            if status == "SUCCEEDED":
                # output는 리스트이며 첫 요소가 비디오 URL로 제공됨
                output_list = getattr(task, "output", None) or []
                asset_url = None
                if isinstance(output_list, list) and output_list:
                    first = output_list[0]
                    if isinstance(first, str) and first.startswith("http"):
                        asset_url = first

                return {
                    "id": task_id,
                    "state": "completed",
                    "asset_url": asset_url,
                    "completed_at": time.time(),
                }

            # 실패 정보가 있다면 즉시 실패 처리
            failure = getattr(task, "failure", None)
            if failure:
                return {
                    "id": task_id,
                    "state": "failed",
                    "asset_url": None,
                    "completed_at": time.time(),
                    "error": str(failure),
                }

            await asyncio.sleep(poll_interval_seconds)

        return {"id": task_id, "state": "timeout", "asset_url": None, "completed_at": time.time()}


# 전역 인스턴스
runway_service = RunwayService()



