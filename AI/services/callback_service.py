"""
스프링 서버 콜백 서비스
스프링 서버와의 콜백 통신을 담당합니다.
"""

import os
import aiohttp
from datetime import datetime


class CallbackService:
    def __init__(self):
        """콜백 서비스를 초기화합니다."""
        # TODO[SPRING]: 스프링 서버 도메인/포트로 변경하세요.
        #   로컬에서 스프링을 9090으로 띄운다면: https://i13a609.p.ssafy.io/ai/api/reviews/assets/callback
        self.callback_url = os.getenv("SPRING_CALLBACK_URL", "https://i13a609.p.ssafy.io/api/reviews/assets/callback")
    async def send_callback_to_spring(self, callback_data: dict) -> dict:
        """
        스프링 서버에 AI 처리 결과 콜백 요청을 전송합니다.
        
        Args:
            callback_data (dict): 콜백 요청 데이터
        
        Returns:
            dict: 스프링 서버 응답
            
        Raises:
            HTTPException: 콜백 전송 실패 시
        """
        try:
            headers = {"Content-Type": "application/json", "Accept": "application/json"}

            async with aiohttp.ClientSession() as session:
                async with session.post(self.callback_url, json=callback_data, headers=headers) as response:
                    # 우선 텍스트로 받아 JSON이 아니어도 안정적으로 처리
                    raw_text = await response.text()
                    try:
                        response_json = await response.json(content_type=None)
                    except Exception:
                        response_json = None
                    
                    if response.status == 200:
                        print(f"콜백 전송 성공: reviewAssetId={callback_data.get('reviewAssetId')}, result={callback_data.get('result')}")
                        return response_json
                        
                    elif response.status == 400:
                        print(f"유효성 검증 실패: reviewAssetId={callback_data.get('reviewAssetId')}")
                        # 6.1 유효성 실패 응답 처리
                        return response_json

                    elif response.status == 500:
                        print(f"서버 오류: reviewAssetId={callback_data.get('reviewAssetId')}")
                        # 6.2 서버 오류 응답 처리
                        return response_json or {
                            "code": "SPRING_ERROR",
                            "message": "Spring server error",
                            "status": response.status,
                            "data": {"rawBody": raw_text[:1000]},
                            "timestamp": datetime.utcnow().isoformat(),
                        }
                    elif response.status in (401, 403):
                        print("콜백 인증 실패(401/403). Authorization 헤더 또는 화이트리스트 설정 필요")
                        return response_json or {
                            "code": "UNAUTHORIZED",
                            "message": "Spring callback requires authentication",
                            "status": response.status,
                            "data": {"rawBody": raw_text[:1000]},
                            "timestamp": datetime.utcnow().isoformat(),
                        }
                        
                    else:
                        print(f"❌ 예상하지 못한 상태 코드: {response.status}")
                        return response_json or {
                            "code": "UNKNOWN_ERROR",
                            "message": f"예상하지 못한 응답 상태: {response.status}",
                            "status": response.status,
                            "data": {"rawBody": raw_text[:1000]},
                            "timestamp": datetime.utcnow().isoformat(),
                            "details": None
                        }
                         
        except Exception as e:
            print(f"❌ 콜백 전송 중 예외 발생: {e}")
            return {
                "code": "NETWORK_ERROR",
                "message": "Spring 콜백 전송 실패",
                "status": 500,
                "data": None,
                "timestamp": datetime.utcnow().isoformat(),
                "details": {"error": str(e)},
            }


# 전역 인스턴스
callback_service = CallbackService()
