"""
이미지 생성 서비스 (DALL·E 3)
"""

import os
from typing import Optional
from dotenv import load_dotenv

try:
    from openai import AsyncOpenAI  # type: ignore
except Exception:  # pragma: no cover
    AsyncOpenAI = None  # type: ignore

load_dotenv()


class ImageService:
    def __init__(self) -> None:
        api_key = os.getenv("GMS_API_KEY")
        base_url = os.getenv("GMS_BASE_URL", "https://gms.ssafy.io/gmsapi/api.openai.com/v1")

        if not api_key or AsyncOpenAI is None:
            print("GMS_API_KEY 를 찾을 수 없거나, openai SDK가 사용 불가능합니다.")
            self.client = None
            return

        self.client = AsyncOpenAI(api_key=api_key, base_url=base_url)
        print(f"Successfully initialized GMS(OpenAI) client (base_url={base_url})")

    def is_available(self) -> bool:
        return self.client is not None

    async def generate_image_url(self, prompt: str, size: str = "1024x1024") -> Optional[str]:
        """
        이미지 URL을 생성하여 반환. 실패 시 None 반환.
        GMS 프록시가 url 또는 b64_json을 줄 수 있어 url 우선으로 시도.
        """
        if not self.is_available():
            raise Exception("GMS_API_KEY가 사용이 불가능합니다. 환경변수 GMS_API_KEY를 재설정(.env) 후 서버를 재시작하세요.")

        try:
            # url 응답 형식을 우선 요청
            resp = await self.client.images.generate(  # type: ignore[union-attr]
                model="dall-e-3",
                prompt=prompt,
                size=size,
                response_format="url",
            )

            # SDK 객체/딕셔너리 모두 대응
            try:
                data0 = resp.data[0]
                url = getattr(data0, "url", None)
            except Exception:
                url = resp.get("data", [{}])[0].get("url") if isinstance(resp, dict) else None

            # url이 없으면 None
            return url
        except Exception as e:
            print(f"Failed to generate image: {e}")
            return None


# 전역 인스턴스
image_service = ImageService()