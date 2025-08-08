"""
Pydantic 데이터 모델 정의
요청/응답 모델들을 정의합니다.
"""

from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime


# 메뉴 정보 모델 - 쇼츠 생성 요청 모델에 포함
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
