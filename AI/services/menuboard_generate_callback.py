"""
메뉴 포스터 생성 콜백 서비스
"""

from __future__ import annotations

import os
from datetime import datetime
from typing import Any, Dict

import aiohttp


class MenuPosterCallbackService:
    def __init__(self) -> None:
        self.callback_url: str = os.getenv(
            "SPRING_MENU_POSTER_CALLBACK_URL",
            "https://i13a609.p.ssafy.io/api/menu-posters/assets/callback",
        )

    async def send_callback_to_spring(self, callback_data: Dict[str, Any]) -> Dict[str, Any]:
        try:
            headers = {"Content-Type": "application/json", "Accept": "application/json"}
            async with aiohttp.ClientSession() as session:
                async with session.post(self.callback_url, json=callback_data, headers=headers) as response:
                    raw_text = await response.text()
                    try:
                        response_json = await response.json(content_type=None)
                    except Exception:
                        response_json = None

                    if response.status == 200:
                        print(
                            f"콜백 전송 성공: assetId={callback_data.get('assetId')}, result={callback_data.get('result')}"
                        )
                        return response_json or {
                            "code": "OK",
                            "message": "Callback returned non-JSON body",
                            "status": 200,
                            "data": {"rawBody": raw_text[:1000]},
                            "timestamp": datetime.utcnow().isoformat(),
                        }
                    elif response.status in (400, 422):
                        print(
                            f"유효성 검증 실패: assetId={callback_data.get('assetId')}"
                        )
                        return response_json or {
                            "code": "VALIDATION_ERROR",
                            "message": "Validation failed at Spring callback",
                            "status": response.status,
                            "data": {"rawBody": raw_text[:1000]},
                            "timestamp": datetime.utcnow().isoformat(),
                        }
                    elif response.status in (401, 403):
                        print("콜백 인증 실패(401/403). 스프링 보안 정책 확인 필요")
                        return response_json or {
                            "code": "UNAUTHORIZED",
                            "message": "Spring callback requires authentication",
                            "status": response.status,
                            "data": {"rawBody": raw_text[:1000]},
                            "timestamp": datetime.utcnow().isoformat(),
                        }
                    elif response.status >= 500:
                        print(
                            f"서버 오류: assetId={callback_data.get('assetId')}"
                        )
                        return response_json or {
                            "code": "SPRING_ERROR",
                            "message": "Spring server error",
                            "status": response.status,
                            "data": {"rawBody": raw_text[:1000]},
                            "timestamp": datetime.utcnow().isoformat(),
                        }
                    else:
                        print(f"예상하지 못한 상태 코드: {response.status}")
                        return response_json or {
                            "code": "UNKNOWN_ERROR",
                            "message": f"예상하지 못한 응답 상태: {response.status}",
                            "status": response.status,
                            "data": {"rawBody": raw_text[:1000]},
                            "timestamp": datetime.utcnow().isoformat(),
                            "details": None,
                        }
        except Exception as e:
            print(f"콜백 전송 중 예외 발생: {e}")
            return {
                "code": "NETWORK_ERROR",
                "message": "Spring 콜백 전송 실패",
                "status": 500,
                "data": None,
                "timestamp": datetime.utcnow().isoformat(),
                "details": {"error": str(e)},
            }


menuboard_generate_callback_service = MenuPosterCallbackService()


