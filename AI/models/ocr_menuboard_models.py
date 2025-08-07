from pydantic import BaseModel, HttpUrl, Field, constr
from datetime import datetime
from typing import List, Optional

# RN to FastAPI model
class OCRMenuRequest(BaseModel):
    sourceId: int = Field(..., description="OCR 요청 식별자 (asset_source.id)")
    storeId: int = Field(..., description="대상 가게 ID")
    userId: int = Field(..., description="요청 사용자 ID")
    imageUrl: HttpUrl = Field(..., description="업로드된 이미지 URL")
    type: str = Field(..., example="MENU", description="요청 타입: MENU 고정")
    requestedAt: datetime = Field(..., description="요청 시각 (ISO8601)")
    expireAt: datetime = Field(..., description="만료 시각 (ISO8601)")
    retryCount: int = Field(default=0, description="재시도 횟수 (기본 0)")

class ClovaImageSpec(BaseModel):
    format: str = Field(..., description="jpg/png 등")
    name:   str = Field(..., description="이미지 식별 이름")

# FastAPI to OCR API model
class ClovaOCRRequest(BaseModel):
    images:    List[ClovaImageSpec]
    requestId: str
    version:   str
    timestamp: int

class ExtractedMenu(BaseModel):
    name: str = Field(..., description="메뉴 이름")
    price: Optional[int] = Field(None, description="메뉴 가격 (null 허용)")

# FastAPI to RN model
class OCRMenuRespond(BaseModel):
    sourceId: int = Field(..., description="OCR 요청 식별자 (asset_source.id)")
    result: constr(regex="^(SUCCESS|FAIL)$") = Field(..., description="생성 결과 (SUCCESS 또는 FAIL)")
    extractedMenus: List[ExtractedMenu] = Field(..., description="추출된 메뉴 항목 목록")

# OCR 콜백 요청 모델 (FastAPI → Spring 서버) - 수정 필요
class OCRCallbackRequest(BaseModel):
    sourceId: int = Field(..., description="OCR 요청 식별자 (asset_source.id)")
    result: constr(regex="^(SUCCESS|FAIL)$") = Field(..., description="OCR 처리 결과")
    extractedMenus: List[ExtractedMenu] = Field(..., description="추출된 메뉴 항목 목록 (실패시 빈 배열)")
    type: str = Field(default="MENU", description="요청 타입: MENU 고정")


