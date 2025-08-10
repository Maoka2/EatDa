"""
생성 관련 API 라우터
영상 생성 엔드포인트를 담당합니다.
"""

import time
from fastapi import APIRouter, HTTPException
from models.shorts_models import GenerateRequest, CallbackRequest, SpringResponse
from services import luma_service, runway_service, gpt_service, callback_service
from utils.logger import default_logger as logger


# 라우터 생성
router = APIRouter(
    prefix="/api",
    tags=["generation"]
)

# 메모리에 영상 생성 정보 저장 (추후 DB로 이관 고려)
generations = {}


@router.post("/reviews/assets/generate", response_model=SpringResponse)
async def generate_video(request: GenerateRequest):
    """
    영상 생성 요청 - luma.py의 로직의 FastAPI
    1. 사용자 프롬프트를 gpt.py(Gpt-4o)로 개선
    2. 개선된 프롬프트로 Luma AI 영상 생성 요청
    generate 흐름의 각 단계에 체크포인트 로그 설정.(logger.info)
    """
    try:
        logger.info("STEP1: start generate")
        if not luma_service.is_available():
            raise HTTPException(
                status_code=500, 
                detail="Luma AI 클라이언트가 초기화되지 않았습니다. 환경변수 LUMAAI_API_KEY를 설정(.env) 후 서버를 재시작하세요."
            )
        
        # print(f"Original prompt: {request.prompt}")

        # 1단계: GPT로 프롬프트 개선
        detailed_prompt = await gpt_service.enhance_prompt(request.prompt)
        logger.info("STEP2: after GPT")
        # print(f"Enhanced prompt: {detailed_prompt}")
        
        # 2단계: 생성 모델 분기 (Luma / Runway)
        #  - SHORTS_RAY2  -> Luma ray-2
        #  - SHORTS_GEN_4 -> Runway gen4_turbo
        req_type = (request.type or "").upper()

        if req_type == "SHORTS_GEN_4":
            # Runway 사용 - gen4_turbo
            if not runway_service.is_available():
                raise HTTPException(
                    status_code=500,
                    detail="Runway ML 클라이언트가 초기화되지 않았습니다. 환경변수 RUNWAY_API_KEY를 설정(.env) 후 서버를 재시작하세요.",
                )
            generation_result = await runway_service.generate_video(
                enhanced_prompt=detailed_prompt,
                reference_images=request.referenceImages,
                model_name="gen4_turbo",
                ratio="720:1280",
                duration_seconds=5,
            )
            logger.info(f"STEP3: after Runway create id={generation_result['id']}")
        else:
            # Luma 사용 - ray-2
            generation_result = await luma_service.generate_video(
                enhanced_prompt=detailed_prompt,
                reference_images=request.referenceImages,
                model_name = "ray-2",
            )
            logger.info(f"STEP3: after Luma create id={generation_result['id']}")

        # 메모리 기록
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

        # 3단계: 생성 완료까지 폴링하여 실제 성공/실패 확인
        logger.info("STEP4: enter polling")
        # runway - gen4 사용
        if req_type == "SHORTS_GEN_4":
            wait = await runway_service.wait_for_generation_completion(generation_result["id"])
        # luma - ray-2 사용
        else:
            wait = await luma_service.wait_for_generation_completion(generation_result["id"])
        logger.info(f"STEP5: polling done state={wait['state']} url={wait.get('asset_url')}")

        is_success = wait["state"] == "completed" and bool(wait.get("asset_url"))
        callback_data = {
            "reviewAssetId": request.reviewAssetId,
            "result": "SUCCESS" if is_success else "FAIL",
            "assetUrl": wait.get("asset_url"),
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
            detail=f"영상 생성 실패 및 콜백 전송 완료: {e}. 환경변수 확인: LUMAAI_API_KEY, GMS_API_KEY, SPRING_CALLBACK_URL"
        )
