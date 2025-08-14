"""
Google Gemini 기반 이미지 생성 서비스 (디스크 저장/베이스 URL 미사용)

특징:
- 텍스트 프롬프트와 선택 이미지 입력(로컬 파일 경로)을 받아 Google GenAI로 이미지 생성
- 첫 번째 생성 이미지를 data URL("data:image/png;base64,...")로 반환

환경 변수:
- GOOGLE_API_KEY: Google GenAI API 키(필수)
"""

from __future__ import annotations

import os
from typing import Optional, List
import base64
import mimetypes
import logging

try:
    # pip install google-genai
    from google import genai  # type: ignore
    from google.genai import types  # type: ignore
except Exception:  # pragma: no cover
    genai = None  # type: ignore
    types = None  # type: ignore


class GoogleImageService:
    def __init__(self) -> None:
        self.api_key = "AIzaSyDXwG0T-pqiiQvhLcghPM8tNBnCcWbjg_8"
        self.logger = logging.getLogger(__name__)

        if not self.api_key or genai is None:
            self.client = None
            reason = "google-genai 미설치" if genai is None else "GOOGLE_API_KEY 미설정"
            try:
                self.logger.warning(f"GoogleImageService 비활성화: {reason}")
            except Exception:
                pass
        else:
            self.client = genai.Client(api_key=self.api_key)
            try:
                self.logger.info("Successfully initialized Google GenAI client")
            except Exception:
                pass

    def is_available(self) -> bool:
        return self.client is not None

    def generate_image_url(self, prompt: str, reference_image_paths: Optional[List[str]] = None) -> Optional[str]:
        """
        이미지를 생성하고, 첫 이미지 결과를 data URL("data:<mime>;base64,<...>")로 반환.
        실패 시 None 반환. reference_image_paths는 로컬 파일 경로 목록.
        """
        if not self.is_available():
            self.logger.warning("GoogleImageService: not available.")
            return None

        contents: list = [prompt]

        # 로컬 파일 경로를 제공받은 경우, 존재하는 파일을 base64 inline_data로 추가
        if reference_image_paths:
            exist_count = 0
            for p in reference_image_paths:
                try:
                    if not p:
                        try:
                            self.logger.info("GoogleImageService: reference path is empty/None")
                        except Exception:
                            pass
                        continue
                    # 입력은 로컬 파일 경로만 허용한다는 전제
                    # 존재/파일 여부 점검 및 상세 로그
                    exists = os.path.exists(p)
                    isfile = os.path.isfile(p)
                    try:
                        self.logger.info(
                            f"GoogleImageService: ref path check path={p}, exists={exists}, isfile={isfile}"
                        )
                    except Exception:
                        pass
                    if not exists:
                        try:
                            self.logger.warning(f"GoogleImageService: reference path not found: path={p}")
                        except Exception:
                            pass
                        continue
                    if not isfile:
                        try:
                            self.logger.warning(f"GoogleImageService: reference path is not a file: path={p}")
                        except Exception:
                            pass
                        continue
                    mime, _ = mimetypes.guess_type(p)
                    mime = mime or "image/png"
                    try:
                        with open(p, "rb") as f:
                            b64 = base64.b64encode(f.read()).decode("ascii")
                    except Exception as read_err:
                        try:
                            self.logger.exception(
                                f"GoogleImageService: failed to read reference file: path={p}, err={read_err}"
                            )
                        except Exception:
                            pass
                        continue
                    contents.append({
                        "inline_data": {"mime_type": mime, "data": b64}
                    })
                    exist_count += 1
                except Exception:
                    # 문제가 있는 파일은 건너뜀
                    continue
            try:
                self.logger.info(f"GoogleImageService: reference images attached: {exist_count}/{len(reference_image_paths)}")
            except Exception:
                pass
            if exist_count == 0:
                try:
                    self.logger.warning("GoogleImageService: no valid reference images attached (all missing/unreadable)")
                except Exception:
                    pass

        try:
            response = self.client.models.generate_content(  # type: ignore[union-attr]
                model="gemini-2.0-flash-preview-image-generation",
                contents=contents,
                # 이 모델은 응답 모달리티 조합으로 ["TEXT", "IMAGE"]를 요구함
                config=types.GenerateContentConfig(response_modalities=["TEXT", "IMAGE"]) if types else None,
            )

            # 첫 번째 이미지 파트를 찾아서 data URL로 변환하여 반환
            for candidate in getattr(response, "candidates", []) or []:
                content = getattr(candidate, "content", None)
                parts = getattr(content, "parts", []) if content else []
                for part in parts:
                    inline_data = getattr(part, "inline_data", None)
                    if inline_data and getattr(inline_data, "data", None):
                        mime = getattr(inline_data, "mime_type", "image/png") or "image/png"
                        data_field = getattr(inline_data, "data")
                        try:
                            raw_bytes: bytes
                            if isinstance(data_field, (bytes, bytearray)):
                                raw_bytes = bytes(data_field)
                            else:
                                raw_bytes = base64.b64decode(str(data_field))
                            b64 = base64.b64encode(raw_bytes).decode("ascii")
                            data_url = f"data:{mime};base64,{b64}"
                            self.logger.info("GoogleImageService: image generated successfully (data URL)")
                            return data_url
                        except Exception as enc_err:
                            self.logger.exception(f"GoogleImageService: failed to encode data URL: {enc_err}")
                            return None

            try:
                self.logger.warning("GoogleImageService: no image in response (candidates/parts missing)")
            except Exception:
                pass
            return None
        except Exception as e:
            try:
                self.logger.exception(f"GoogleImageService: generation error: {e}")
            except Exception:
                pass
            return None


# 전역 인스턴스
google_image_service = GoogleImageService()


