"""
이벤트 배너/에셋 생성용 Pydantic 모델
기존 event_asset_models 를 대체
"""

from __future__ import annotations

from typing import List, Optional, Literal
from pydantic import BaseModel, Field


class EventAssetGenerateMessage(BaseModel):
    eventAssetId: int = Field(..., description="에셋 생성 요청의 식별자 (event_asset.id)")
    type: Literal["IMAGE"] = Field("IMAGE", description="생성 타입 (항상 IMAGE)")
    prompt: str = Field(..., description="사용자 입력 프롬프트")
    storeId: int = Field(..., description="이벤트 대상 가게 ID")
    userId: int = Field(..., description="요청 사용자 ID")
    title: str = Field(..., description="이벤트 제목")
    startDate: str = Field(..., description="이벤트 시작일 (yyyy-MM-dd)")
    endDate: str = Field(..., description="이벤트 종료일 (yyyy-MM-dd)")
    requestedAt: str = Field(..., description="요청 시각 (ISO8601)")
    expireAt: str = Field(..., description="만료 시각 (ISO8601)")
    retryCount: int = Field(default=0, description="재시도 횟수")
    referenceImages: List[str] = Field(default_factory=list, description="사용자 업로드 참고 이미지 URL 목록")


class EventAssetCallbackRequest(BaseModel):
    assetId: int = Field(...)
    result: str = Field(..., description='"SUCCESS" 또는 "FAIL"')
    assetUrl: Optional[str] = Field(None)
    type: Literal["IMAGE"] = Field("IMAGE", description='항상 "IMAGE"')


