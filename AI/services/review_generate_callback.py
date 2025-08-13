"""
리뷰(생성) 콜백 서비스
기존 review_callback_service 를 대체
"""

import os
import aiohttp
from datetime import datetime
import logging


class ReviewCallbackService:
    def __init__(self):
        self.logger = logging.getLogger(__name__)
     #  self.callback_url = os.getenv("SPRING_CALLBACK_URL", "https://i13a609.p.ssafy.io/test/api/reviews/assets/callback")
        self.callback_url = "https://i13a609.p.ssafy.io/test/api/reviews/assets/callback"

    async def send_callback_to_spring(self, callback_data: dict) -> dict:
        try:
            headers = {"Content-Type": "application/json", "Accept": "application/json"}
            async with aiohttp.ClientSession() as session:
                # 요청 직전 상세 로그 (타임스탬프는 로거 포맷에서 자동 포함)
                try:
                    self.logger.info(
                        "\n".join(
                            [
                                "[ReviewCallback] Sending callback",
                                f"- url: {self.callback_url}",
                                f"- headers: {headers}",
                                f"- payload: {callback_data}",
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
                            f"콜백 전송 성공: reviewAssetId={callback_data.get('reviewAssetId')}, result={callback_data.get('result')}"
                        )
                        return response_json or {
                            "code": "OK",
                            "message": "Callback returned non-JSON body",
                            "status": 200,
                            "data": {"rawBody": raw_text[:1000]},
                            "timestamp": datetime.utcnow().isoformat(),
                        }
                    elif response.status in (400, 422):
                        self.logger.warning(f"유효성 검증 실패: reviewAssetId={callback_data.get('reviewAssetId')}")
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
                        self.logger.error(f"서버 오류: reviewAssetId={callback_data.get('reviewAssetId')}")
                        return response_json or {
                            "code": "SPRING_ERROR",
                            "message": "Spring server error",
                            "status": response.status,
                            "data": {"rawBody": raw_text[:1000]},
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
                                    "[ReviewCallback] Unexpected status",
                                    f"- status: {response.status} {reason}",
                                    f"- request: {req_method} {req_url}",
                                    f"- response.url: {resp_url}",
                                    f"- callback_url(env): {self.callback_url}",
                                    f"- response.headers: {dict(response.headers)}",
                                    f"- rawBody(first 500B): {raw_text[:500]}",
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
                                "responseReason": str(reason),
                                "responseHeaders": dict(response.headers),
                                "rawBody": raw_text[:1000],
                                "callbackUrlEnv": self.callback_url,
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


review_generate_callback = ReviewCallbackService()


