"""
생성 관련 API 라우터
영상 생성 엔드포인트를 담당합니다.
"""

import time
from fastapi import APIRouter, HTTPException
from models.request_models import GenerateRequest, CallbackRequest, SpringResponse
from services import luma_service, gpt_service, callback_service


# 라우터 생성
router = APIRouter(
    prefix="/api/reviews/assests",
    tags=["generation"]
)

# 메모리에 영상 생성 정보 저장 (추후 DB로 이관 고려)
generations = {}


@router.post("/api/reviews/assests/generate", response_model=SpringResponse)
async def generate_video(request: GenerateRequest):
    """
    영상 생성 요청 - luma.py의 로직의 FastAPI
    1. 사용자 프롬프트를 gpt.py(Gpt-4o)로 개선
    2. 개선된 프롬프트로 Luma AI 영상 생성 요청
    """
    try:
        if not luma_service.is_available():
            raise HTTPException(
                status_code=500, 
                detail="Luma AI 클라이언트가 초기화되지 않았습니다. API 키를 확인하세요."
            )
        
        # print(f"Original prompt: {request.prompt}")

        # 1단계: GPT로 프롬프트 개선
        detailed_prompt = await gpt_service.enhance_prompt(request.prompt)
        # print(f"Enhanced prompt: {detailed_prompt}")
        
        # 2단계: Luma AI로 영상 생성 요청
        # print(" Sending video generation request to Luma AI…")
        generation_result = await luma_service.generate_video(detailed_prompt, request.referenceImages)
        
        # 메모리에 생성 정보 저장 - 코드 잔류 여부 논의 필요
        generations[generation_result["id"]] = {
            "state": generation_result["state"],          # Optional[Literal["queued", "dreaming", "completed", "failed"]] = None
            "original_prompt": request.prompt,
            "enhanced_prompt": detailed_prompt,
            "created_at": generation_result["created_at"],
            "reviewAssetId": request.reviewAssetId,  # eventAssetId → reviewAssetId로 변경
            "type": request.type,
            "storeId": request.storeId,
            "userId": request.userId
        }
        
        # print(f"영상 생성 요청 완료 ID: {generation_result['id']}")
        
        # Luma AI 완료까지 대기 (실제로는 폴링하지만 여기서는 생성 완료로 가정)
        # TODO: 웹훅이나 폴링으로 완료 상태 확인 필요 여부 논의 필요 -> 성공 시 알림을 띄울거라면...
        
        # 성공 시 콜백 데이터 생성 및 스프링 서버 전송
        callback_data = {
            "reviewAssetId": request.reviewAssetId,
            "result": "SUCCESS",  # 일단 성공으로 가정
            "assetUrl": f"https://example.com/video/{generation_result['id']}.mp4",  # 임시 URL
            "type": request.type
        }
        
        # 스프링 서버에 콜백 전송하고 응답 받기
        spring_response = await callback_service.send_callback_to_spring(callback_data)
        
        return spring_response
    
    # 예외 처리 - 실패 시 콜백 전송
    except Exception as e:
        print(f"❌ 영상 생성 실패: {e}")
        # 1) 실패 콜백 전송
        callback_data = {
            "reviewAssetId": request.reviewAssetId,
            "result": "FAIL",
            "assetUrl": None,
            "type": request.type
        }
        spring_response = await callback_service.send_callback_to_spring(callback_data)
        
        # 2) 콜백 전송까지 완료했으면, 클라이언트엔 에러로 응답
        raise HTTPException(
            status_code=500,
            detail=f"영상 생성 실패 및 콜백 전송 완료: {e}"
        )
