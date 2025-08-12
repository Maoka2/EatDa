"""
이벤트 에셋 생성 콜백 서비스
기존 event_callback_service 를 대체
"""

from __future__ import annotations

import os
from datetime import datetime
from typing import Any, Dict
import logging
import aiohttp


class EventCallbackService:
    def __init__(self) -> None:
        # 모듈 전용 로거
        self.logger = logging.getLogger(__name__)
        # 스프링 콜백 URL
        self.callback_url = "https://i13a609.p.ssafy.io/test/api/events/assets/callback"

    async def send_callback_to_spring(self, callback_data: Dict[str, Any]) -> Dict[str, Any]:
        try:
            headers = {"Content-Type": "application/json", "Accept": "application/json"}
            async with aiohttp.ClientSession() as session:
                # [요청 준비] 콜백 전송 전에 요청 메타/페이로드 로깅
                try:
                    self.logger.info(
                        "\n".join(
                            [
                                "[EventCallback] Sending callback",
                                f"- url: {self.callback_url}",
                                f"- headers: {headers}",
                                f"- payload: {callback_data}",
                            ]
                        )
                    )
                except Exception:
                    pass

                async with session.post(self.callback_url, json=callback_data, headers=headers) as response:
                    # [응답 수신] 본문 텍스트 및 JSON 시도 파싱
                    raw_text = await response.text()
                    try:
                        response_json = await response.json(content_type=None)
                    except Exception:
                        response_json = None

                    if response.status == 200:
                        # [성공] 최소 메타만 간결하게 남김
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
                        # [클라이언트 오류] 유효성 문제 등
                        # 상세 진단 로그 추가 (요청/응답 메타, 본문 일부)
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
                                    "[EventCallback] 4xx from Spring (validation)",
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
                        # JSON 바디가 파싱되지 않는 환경(폼 파라미터 요구) 대비 1회 form 재시도
                        should_retry_form = False
                        try:
                            if response_json and isinstance(response_json, dict):
                                data_obj = response_json.get("data")
                                if isinstance(data_obj, dict):
                                    keys = set(data_obj.keys())
                                    if {"result", "assetId", "type"}.issubset(keys):
                                        should_retry_form = True
                        except Exception:
                            pass

                        if should_retry_form:
                            form_headers = {"Content-Type": "application/x-www-form-urlencoded", "Accept": "application/json"}
                            try:
                                self.logger.info(
                                    "\n".join(
                                        [
                                            "[EventCallback] Retry with form-encoded due to 4xx validation",
                                            f"- url: {self.callback_url}",
                                            f"- headers: {form_headers}",
                                            f"- form: {callback_data}",
                                        ]
                                    )
                                )
                            except Exception:
                                pass

                            async with session.post(self.callback_url, data=callback_data, headers=form_headers) as resp2:
                                raw_text2 = await resp2.text()
                                try:
                                    resp2_json = await resp2.json(content_type=None)
                                except Exception:
                                    resp2_json = None

                                if resp2.status == 200:
                                    self.logger.info(
                                        f"콜백 전송 성공(form): assetId={callback_data.get('assetId')}, result={callback_data.get('result')}"
                                    )
                                    return resp2_json or {
                                        "code": "OK",
                                        "message": "Callback returned non-JSON body (form)",
                                        "status": 200,
                                        "data": {"rawBody": raw_text2[:1000]},
                                        "timestamp": datetime.utcnow().isoformat(),
                                    }
                                else:
                                    self.logger.warning(
                                        "\n".join(
                                            [
                                                "[EventCallback] Form retry failed",
                                                f"- status: {resp2.status}",
                                                f"- response.headers: {dict(resp2.headers)}",
                                                f"- rawBody(first 1000B): {raw_text2[:1000]}",
                                            ]
                                        )
                                    )
                                    return resp2_json or {
                                        "code": "VALIDATION_ERROR",
                                        "message": "Validation failed at Spring callback (form retry failed)",
                                        "status": resp2.status,
                                        "data": {"rawBody": raw_text2[:1000]},
                                        "timestamp": datetime.utcnow().isoformat(),
                                    }

                        return response_json or {
                            "code": "VALIDATION_ERROR",
                            "message": "Validation failed at Spring callback",
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
                    elif response.status in (401, 403):
                        # [인증/인가 오류]
                        self.logger.error("콜백 인증 실패(401/403). 스프링 보안 정책 확인 필요")
                        return response_json or {
                            "code": "UNAUTHORIZED",
                            "message": "Spring callback requires authentication",
                            "status": response.status,
                            "data": {"rawBody": raw_text[:1000]},
                            "timestamp": datetime.utcnow().isoformat(),
                        }
                    elif response.status >= 500:
                        # [서버 오류] 요청/응답 메타데이터를 상세히 남김
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
                                    "[EventCallback] 5xx from Spring",
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
                        # [기타 예외 상태] 상세 진단 로그
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
                                    "[EventCallback] Unexpected status",
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


event_image_callback_service = EventCallbackService()


