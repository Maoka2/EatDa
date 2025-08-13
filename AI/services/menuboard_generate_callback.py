"""
메뉴 포스터 생성 콜백 서비스
"""

from __future__ import annotations

import os
from datetime import datetime
from typing import Any, Dict
import logging
import aiohttp


class MenuPosterCallbackService:
    def __init__(self) -> None:
        self.logger = logging.getLogger(__name__)
        self.callback_url= "https://i13a609.p.ssafy.io/test/api/menu-posters/assets/callback"
        

    async def send_callback_to_spring(self, callback_data: Dict[str, Any]) -> Dict[str, Any]:
        try:
            headers = {"Content-Type": "application/json", "Accept": "application/json"}
            async with aiohttp.ClientSession() as session:
                # 상세 요청 로그
                try:
                    # data URL이 너무 길어 로그를 오염시키지 않도록 축약 출력
                    pretty_payload = dict(callback_data)
                    au = pretty_payload.get("assetUrl")
                    if isinstance(au, str) and au.startswith("data:"):
                        try:
                            header, b64 = au.split(",", 1)
                            pretty_payload["assetUrl"] = f"{header},<base64 {len(b64)} bytes>"
                        except Exception:
                            pretty_payload["assetUrl"] = "data:<inline image>"
                    self.logger.info(
                        "\n".join(
                            [
                                "[MenuPosterCallback] Sending callback",
                                f"- url: {self.callback_url}",
                                f"- headers: {headers}",
                                f"- payload: {pretty_payload}",
                            ]
                        )
                    )
                except Exception:
                    pass

                async with session.post(self.callback_url, json=callback_data, headers=headers) as response:
                    raw_text = await response.text()
                    try:
                        response_json = await response.json(content_type=None)
                    except Exception:
                        response_json = None

                    if response.status == 200:
                        self.logger.info(
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
                        self.logger.warning(
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
                        self.logger.error("콜백 인증 실패(401/403). 스프링 보안 정책 확인 필요")
                        return response_json or {
                            "code": "UNAUTHORIZED",
                            "message": "Spring callback requires authentication",
                            "status": response.status,
                            "data": {"rawBody": raw_text[:1000]},
                            "timestamp": datetime.utcnow().isoformat(),
                        }
                    elif response.status >= 500:
                        # 5xx도 상세 진단 로그 남김
                        try:
                            req_info = response.request_info
                            req_method = getattr(req_info, "method", "?")
                            req_url = str(getattr(req_info, "url", self.callback_url))
                        except Exception:
                            req_method, req_url = "?", self.callback_url

                        resp_url = str(getattr(response, "url", self.callback_url))
                        reason = getattr(response, "reason", "")
                        self.logger.error(
                            "\n".join(
                                [
                                    "[MenuPosterCallback] 5xx from Spring",
                                    f"- status: {response.status} {reason}",
                                    f"- request: {req_method} {req_url}",
                                    f"- response.url: {resp_url}",
                                    f"- callback_url(env): {self.callback_url}",
                                    f"- response.headers: {dict(response.headers)}",
                                    f"- rawBody(first 1000B): {raw_text[:1000]}",
                                    f"- sent.payload: {callback_data}",
                                    f"- sent.headers: {headers}",
                                ]
                            )
                        )
                        return response_json or {
                            "code": "SPRING_ERROR",
                            "message": "Spring server error",
                            "status": response.status,
                            "data": {
                                "requestMethod": req_method,
                                "requestUrl": req_url,
                                "responseUrl": resp_url,
                                "responseHeaders": dict(response.headers),
                                "rawBody": raw_text[:1000],
                                "callbackUrlEnv": self.callback_url,
                                "payload": callback_data,
                            },
                            "timestamp": datetime.utcnow().isoformat(),
                        }
                    else:
                        # 상세 진단 로그: 상태코드/사유, 요청/응답 메타데이터, 본문 일부를 출력
                        try:
                            req_info = response.request_info
                            req_method = getattr(req_info, "method", "?")
                            req_url = str(getattr(req_info, "url", self.callback_url))
                        except Exception:
                            req_method, req_url = "?", self.callback_url

                        resp_url = str(getattr(response, "url", self.callback_url))
                        reason = getattr(response, "reason", "")
                        self.logger.warning(
                            "\n".join(
                                [
                                    "[MenuPosterCallback] Unexpected status",
                                    f"- status: {response.status} {reason}",
                                    f"- request: {req_method} {req_url}",
                                    f"- response.url: {resp_url}",
                                    f"- callback_url(env): {self.callback_url}",
                                    f"- response.headers: {dict(response.headers)}",
                                    f"- rawBody(first 1000B): {raw_text[:1000]}",
                                    f"- sent.payload: {callback_data}",
                                    f"- sent.headers: {headers}",
                                ]
                            )
                        )
                        return response_json or {
                            "code": "UNKNOWN_ERROR",
                            "message": f"예상하지 못한 응답 상태: {response.status}",
                            "status": response.status,
                            "data": {
                                "requestMethod": req_method,
                                "requestUrl": req_url,
                                "responseUrl": resp_url,
                                "responseHeaders": dict(response.headers),
                                "rawBody": raw_text[:1000],
                                "callbackUrlEnv": self.callback_url,
                                "payload": callback_data,
                            },
                            "timestamp": datetime.utcnow().isoformat(),
                        }
        except Exception as e:
            self.logger.exception(f"콜백 전송 중 예외 발생: {e}")
            return {
                "code": "NETWORK_ERROR",
                "message": "Spring 콜백 전송 실패",
                "status": 500,
                "data": None,
                "timestamp": datetime.utcnow().isoformat(),
                "details": {"error": str(e)},
            }


menuboard_generate_callback_service = MenuPosterCallbackService()


