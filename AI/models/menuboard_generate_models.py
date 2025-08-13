"""
메뉴 포스터 생성용 Pydantic 모델
기존 menu_poster_models 를 대체
"""

from __future__ import annotations

from typing import List, Optional
from pydantic import BaseModel, Field


class MenuItem(BaseModel):
    id: int = Field(..., description="메뉴 ID")
    name: str = Field(..., description="메뉴 이름")
    description: Optional[str] = Field("", description="메뉴 설명")  # None도 허용 + 기본값은 빈 문자열
    imageUrl: str = Field(..., description="메뉴 이미지 URL")


class MenuPosterGenerateMessage(BaseModel):
    menuPosterAssetId: int = Field(..., description="포스터 생성 요청의 식별자 (menu_poster.id)")
    type: str = Field(..., description="생성 타입 (IMAGE 고정)")
    prompt: str = Field(..., description="사용자 입력 프롬프트")
    storeId: int = Field(..., description="대상 가게 ID")
    userId: int = Field(..., description="요청 사용자 ID")
    requestedAt: str = Field(..., description="요청 시각 (ISO8601)")
    expireAt: str = Field(..., description="만료 시각 (ISO8601)")
    retryCount: int = Field(default=0, description="재시도 횟수")
    menu: List[MenuItem] = Field(default_factory=list, description="포함할 메뉴 상세 정보 목록")
    referenceImages: List[str] = Field(default_factory=list, description="참고 이미지 URL 목록")


class MenuPosterCallbackRequest(BaseModel):
    assetId: int = Field(...)
    result: str = Field(..., description='"SUCCESS" 또는 "FAIL"')
    assetUrl: Optional[str] = Field(None)
    type: str = Field(..., description='"IMAGE" 고정')


