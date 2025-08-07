import os
import io                           # 메모리 버퍼 사용
import asyncio                      # 비동기 작업 처리
import time                         # 시간 측정

from fastapi import FastAPI, HTTPException
from fastapi.responses import StreamingResponse
from fastapi.middleware.cors import CORSMiddleware

# 데이터 검증
from pydantic import BaseModel, Field
from typing import List, Optional, Union
from datetime import datetime

# 환경 변수 로드(.env)
from dotenv import load_dotenv

# Luma AI 클라이언트 초기화
from lumaai import AsyncLumaAI

# GPT 프롬프트 생성
from gms_api.gpt import generate_luma_prompt

# HTTP 클라이언트
import requests
import aiohttp

load_dotenv()  # .env 파일 로드

# FastAPI 초기화화
app = FastAPI(
    title="AI API",
    description="AI API 서버 구축 - 테스트 및 쇼츠 생성 ai(luma ai) 연동",
    version="1.0.0"
)

# CORS 설정 (프론트엔드에서 접근할 수 있도록) - 개발용(테스트)이라 대부분 허용
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],        # 모든 출처 허용
    allow_credentials=True,     # 인증 정보 허용(쿠키 / authorization 헤더 포함)
    allow_methods=["*"],        # 모든 메서드 허용(GET, POST, PUT, DELETE, OPTIONS 등)
    allow_headers=["*"],        # 모든 헤더 허용
)

# Luma AI 클라이언트 초기화
try:
    client = AsyncLumaAI(auth_token=os.getenv("LUMAAI_API_KEY"))
    print("Successfully initialized Luma AI client")
except Exception :
    print(f"Failed to initialize Luma AI client: {Exception}")
    client = None

generations = {}  # 메모리에 영상 생성 정보 저장
 
# 메뉴 정보 모델 - 아래 쇼츠 생성 요청 모델에 포함
class Menu(BaseModel):
    id: int = Field(..., description="메뉴 ID")
    name: str = Field(..., description="메뉴 이름")
    description: str = Field(..., description="메뉴 설명")
    imageUrl: str = Field(..., description="메뉴 이미지 URL")

# 쇼츠 생성 요청 모델
class GenerateRequest(BaseModel):
    reviewAssetId: int = Field(..., description="리뷰 에셋 생성 요청의 식별자")
    type: str = Field(..., description="생성할 에셋 타입 (IMAGE 또는 SHORTS)")
    prompt: str = Field(..., description="사용자 입력 프롬프트")
    storeId: int = Field(..., description="리뷰 대상 가게 ID")
    userId: int = Field(..., description="요청을 보낸 사용자 ID")
    requestedAt: str = Field(..., description="요청 발생 시각 (ISO8601)")
    expireAt: str = Field(..., description="메시지 유효 기간 (ISO8601)")
    retryCount: int = Field(default=0, description="재시도 횟수")
    menu: List[Menu] = Field(..., description="선택한 메뉴 상세 정보 목록")
    referenceImages: List[str] = Field(..., min_length=1, max_length=3, description="참고 이미지 URL 목록 (최소 1개, 최대 3개)")

# 쇼츠 생성 응답 모델 + 스프링 서버 콜백 요청
class CallbackRequest(BaseModel):
    reviewAssetId: int = Field(..., description="생성 요청 식별자 (review_asset.id)")
    result: str = Field(..., description="생성 결과 (SUCCESS 또는 FAIL)")            
    assetUrl: Optional[str] = Field(None, description="생성된 이미지 또는 숏폼 파일 URL (실패시 null)")    
    type: str = Field(..., description="생성 타입 (IMAGE 또는 SHORTS)")

# 스프링 서버 응답 모델
class SpringResponse(BaseModel):
    code: str = Field(..., description="응답 코드")
    message: str = Field(..., description="응답 메시지") 
    status: int = Field(..., description="HTTP 상태 코드")
    data: Optional[dict] = Field(None, description="응답 데이터")
    timestamp: str = Field(..., description="응답 시각")
    details: Optional[dict] = Field(None, description="오류 상세 정보 (400 에러시)")              

# 스프링 서버 콜백 전송 함수
async def send_callback_to_spring(callback_data: CallbackRequest) -> SpringResponse:
    """
    스프링 서버에 AI 처리 결과 콜백 요청을 전송합니다.
    
    Args:
        callback_data (CallbackRequest): 콜백 요청 데이터
    
    Returns:
        SpringResponse: 스프링 서버 응답
        
    Raises:
        HTTPException: 콜백 전송 실패 시
    """
    callback_url = os.getenv("SPRING_CALLBACK_URL", "http://localhost:8080/api/reviews/assets/callback")
    
    try:
        async with aiohttp.ClientSession() as session:
            async with session.post(
                callback_url,
                json=callback_data.dict(),
                headers={"Content-Type": "application/json"}
            ) as response:
                response_json = await response.json()
                
                if response.status == 200:
                    print(f"콜백 전송 성공: reviewAssetId={callback_data.reviewAssetId}, result={callback_data.result}")
                    return SpringResponse(**response_json)
                    
                elif response.status == 400:
                    print(f"유효성 검증 실패: reviewAssetId={callback_data.reviewAssetId}")
                    # 6.1 유효성 실패 응답 처리
                    return SpringResponse(**response_json)

                elif response.status == 500:
                    print(f"서버 오류: reviewAssetId={callback_data.reviewAssetId}")
                    # 6.2 서버 오류 응답 처리
                    return SpringResponse(**response_json)
                    
                else:
                    print(f"❌ 예상하지 못한 상태 코드: {response.status}")
                    return SpringResponse(
                        code="UNKNOWN_ERROR",
                        message=f"예상하지 못한 응답 상태: {response.status}",
                        status=response.status,
                        data=None,
                        timestamp="2025-01-01T00:00:00Z",
                        details=None
                    )
                     
    except Exception as e:
        print(f"❌ 콜백 전송 중 예외 발생: {e}")
        return SpringResponse(
            code="NETWORK_ERROR",
            message="Spring 콜백 전송 실패",
            status=500,
            data=None,
            timestamp=datetime.utcnow().isoformat(),
            details={"error": str(e)},
        )

# API 서버 상태 확인(루트 페이지)
@app.get("/609")
async def root():
    return {"message": "AI API Server is running"}

# 헬스 체크 엔드포인트
@app.get("/health")
async def health_check():
    return {"status": "healthy"}

# 쇼츠 생성 요청 엔드포인트
# '# print()'는 디버깅용 코드로 주석 처리 
@app.post("/api/reviews/assests/generate", response_model=SpringResponse)
async def generate_video(request: GenerateRequest):
    """
    영상 생성 요청 - luma.py의 로직의 FastAPI
    1. 사용자 프롬프트를 gpt.py(Gpt-4o)로 개선
    2. 개선된 프롬프트로 Luma AI 영상 생성 요청
    """
    try:
        if client is None:
            raise HTTPException(
                status_code=500, 
                detail="Luma AI 클라이언트가 초기화되지 않았습니다. API 키를 확인하세요."
            )
        
        # print(f"Original prompt: {request.prompt}")

        # 1단계: GPT로 프롬프트 개선 (gpt.py 사용)
        detailed_prompt = await generate_luma_prompt(request.prompt)
        # print(f"Enhanced prompt: {detailed_prompt}")
        
        # 2단계: keyframes 동적 생성 (referenceImages 사용)
        keyframes = {}
        for i, url in enumerate(request.referenceImages):
            keyframes[f"frame{i}"] = {
                "type": "image",
                "url": url
            }
     
        # 3단계: Luma AI로 영상 생성 요청 (luma.py 로직 사용)
        # print(" Sending video generation request to Luma AI…")
        generation = await client.generations.create(
            prompt=detailed_prompt,
            model="ray-2",
            loop=True,
            aspect_ratio="9:16",
            duration="5s",
            keyframes=keyframes
        )
        
        # 메모리에 생성 정보 저장 - 코드 잔류 여부 논의 필요
        generations[generation.id] = {
            "state": generation.state,          # Optional[Literal["queued", "dreaming", "completed", "failed"]] = None
            "original_prompt": request.prompt,
            "enhanced_prompt": detailed_prompt,
            "created_at": time.time(),
            "reviewAssetId": request.reviewAssetId,  # eventAssetId → reviewAssetId로 변경
            "type": request.type,
            "storeId": request.storeId,
            "userId": request.userId
        }
        
        # print(f"영상 생성 요청 완료 ID: {generation.id}")
        
        # Luma AI 완료까지 대기 (실제로는 폴링하지만 여기서는 생성 완료로 가정)
        # TODO: 웹훅이나 폴링으로 완료 상태 확인 필요 여부 논의 필요 -> 성공 시 알림을 띄울거라면...
        
        # 성공 시 CallbackRequest 생성 및 스프링 서버 전송
        callback_data = CallbackRequest(
            reviewAssetId=request.reviewAssetId,
            result="SUCCESS",  # 일단 성공으로 가정
            assetUrl=f"https://example.com/video/{generation.id}.mp4",  # 임시 URL
            type=request.type
        )
        
        # 스프링 서버에 콜백 전송하고 응답 받기
        spring_response = await send_callback_to_spring(callback_data)
        
        return spring_response
    
    # 예외 처리 - 실패 시 콜백 전송
    except Exception as e:
        print(f"❌ 영상 생성 실패: {e}")
        # 1) 실패 콜백 전송
        callback_data = CallbackRequest(
            reviewAssetId=request.reviewAssetId,
            result="FAIL",
            assetUrl=None,
            type=request.type
        )
        spring_response = await send_callback_to_spring(callback_data)
        
        # 2) 콜백 전송까지 완료했으면, 클라이언트엔 에러로 응답
        raise HTTPException(
            status_code=500,
            detail=f"영상 생성 실패 및 콜백 전송 완료: {e}"
        )

# 서버 실행 (개발용)
if __name__ == "__main__":
    import uvicorn
    print("🚀 AI Video Generation API 서버를 시작합니다...")
    uvicorn.run("main:app", host="0.0.0.0", port=8080, reload=True)

