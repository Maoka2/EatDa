"""
Luma AI 서비스
Luma AI와의 연동을 담당합니다.
"""

import os
import time
from typing import Dict, Any
from lumaai import AsyncLumaAI
from typing import List
from dotenv import load_dotenv

load_dotenv()

class LumaService:
    def __init__(self):
        """Luma AI 클라이언트를 초기화합니다."""
        try:
            api_key = os.getenv("LUMAAI_API_KEY")
            if not api_key:
                print("LUMAAI_API_KEY not found, Luma service will be disabled")
                self.client = None
                return
            
            self.client = AsyncLumaAI(auth_token=api_key)
            print("Successfully initialized Luma AI client")
        except Exception as e:
            print(f"Failed to initialize Luma AI client: {e}")
            self.client = None
    
    def is_available(self) -> bool:
        """Luma AI 클라이언트가 사용 가능한지 확인합니다."""
        return self.client is not None
    
    async def generate_video(self, enhanced_prompt: str, reference_images: list, model_name: str = "ray-2") -> Dict[str, Any]:
        """
        Luma AI로 영상을 생성합니다.
        
        Args:
            enhanced_prompt (str): 개선된 프롬프트
            reference_images (list): 참고 이미지 URL 목록
            model_name (str): 사용할 Luma 모델명 (기본값: "ray-2")
            
        Returns:
            Dict[str, Any]: 생성 결과 정보
            
        Raises:
            Exception: Luma AI 클라이언트가 없거나 생성 실패 시
        """
        if not self.is_available():
            raise Exception("Luma AI 클라이언트가 초기화되지 않았습니다. API 키를 확인하세요.")
        
        # keyframes 동적 생성 (referenceImages 사용)
        keyframes = {}
        for i, url in enumerate(reference_images):
            keyframes[f"frame{i}"] = {
                "type": "image",
                "url": url
            }
        
        # Luma AI로 영상 생성 요청
        generation = await self.client.generations.create(
            prompt=enhanced_prompt,
            model=model_name,
            loop=True,
            aspect_ratio="9:16",
            duration="5s",
            keyframes=keyframes
        )
        
        return {
            "id": generation.id,
            "state": generation.state,
            "created_at": time.time()
        }

    async def wait_for_generation_completion(
        self,
        generation_id: str,
        poll_interval_seconds: float = 3.0,
        timeout_seconds: float = 240.0,
    ) -> Dict[str, Any]:
        """
        생성 완료/실패까지 폴링합니다. 완료되면 가능한 경우 asset URL을 추출해 반환합니다.

        Returns:
            { "id": str, "state": str, "asset_url": Optional[str], "completed_at": float }
        """
        if not self.is_available():
            raise Exception("Luma AI 클라이언트가 초기화되지 않았습니다. LUMAAI_API_KEY 환경변수를 설정하세요.")

        import asyncio
        start = time.time()
        last_state = None
        while time.time() - start < timeout_seconds:
            try:
                # SDK 별 메소드명이 다를 수 있어 안전하게 시도
                try:
                    gen = await self.client.generations.get(generation_id)
                except Exception:
                    gen = await self.client.generations.retrieve(generation_id)
            except Exception as fetch_err:
                # 가져오기 실패 시 잠시 대기 후 재시도
                last_state = f"error: {fetch_err}"
                await asyncio.sleep(poll_interval_seconds)
                continue

            state = getattr(gen, "state", None) or getattr(gen, "status", None) or "unknown"
            if state != last_state:
                last_state = state
                print(f"[Luma] generation {generation_id} state: {state}")

            if state in ("completed", "failed"):
                asset_url = None
                # 다양한 필드 케이스에 대응: dict, pydantic, 객체 속성 모두 처리
                try:
                    # 1) 가능한 경우 딕셔너리로 변환하여 탐색
                    data = None
                    try:
                        if hasattr(gen, "model_dump"):
                            data = gen.model_dump()
                        elif hasattr(gen, "dict"):
                            data = gen.dict()
                    except Exception:
                        data = None

                    if isinstance(data, dict):
                        assets = data.get("assets")
                        if isinstance(assets, dict):
                            # 우선 video 키 우선
                            if isinstance(assets.get("video"), str):
                                asset_url = assets.get("video")
                            else:
                                # http로 시작하는 값을 우선 사용
                                for v in assets.values():
                                    if isinstance(v, str) and v.startswith("http"):
                                        asset_url = v
                                        break

                    # 2) 딕셔너리화가 실패했다면 속성 접근으로 재시도
                    if asset_url is None:
                        assets_attr = getattr(gen, "assets", None)
                        if assets_attr is not None:
                            video_attr = getattr(assets_attr, "video", None)
                            if isinstance(video_attr, str):
                                asset_url = video_attr
                            else:
                                # dict-like?
                                try:
                                    video_like = assets_attr.get("video")  # type: ignore
                                    if isinstance(video_like, str):
                                        asset_url = video_like
                                except Exception:
                                    pass

                        if asset_url is None and hasattr(gen, "video") and isinstance(getattr(gen, "video"), str):
                            asset_url = getattr(gen, "video")

                        if asset_url is None and hasattr(gen, "media") and isinstance(getattr(gen, "media"), list):
                            for m in getattr(gen, "media"):
                                url = (m.get("url") if isinstance(m, dict) else None)
                                if isinstance(url, str) and url.startswith("http"):
                                    asset_url = url
                                    break
                except Exception:
                    # URL 추출 실패는 None 유지
                    pass

                return {
                    "id": generation_id,
                    "state": state,
                    "asset_url": asset_url,
                    "completed_at": time.time(),
                }

            await asyncio.sleep(poll_interval_seconds)

        return {"id": generation_id, "state": "timeout", "asset_url": None, "completed_at": time.time()}


# 전역 인스턴스
luma_service = LumaService()
