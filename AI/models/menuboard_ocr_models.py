from pydantic import BaseModel, Field
from datetime import datetime
from typing import List, Optional, Literal


# RN to FastAPI model
class OCRMenuRequest(BaseModel):
    file: Optional[bytes] = Field(None, description="업로드된 메뉴 이미지 파일")

# FastAPI to RN model - Initial request respond (POST /ai/api/menu-extraction)
class OCRMenuRespond(BaseModel):
    code: Literal["MENUBOARD_REQUESTED", "MENUBOARD_REQUESTED_FAILED"] = Field(
        ..., description="응답 코드"
    )
    message: str = Field(..., description="응답 메시지")
    status: int = Field(..., description="HTTP 유사 상태 코드 숫자-200 성공, 400 실패")
    assetId: Optional[int] = Field(
        None, description="OCR 요청 식별자(12자리 숫자, 성공 시 포함, 실패 시 없음)"
    )
    timestamp: datetime = Field(..., description="응답 생성 시간(ISO8601)")


class ClovaImageSpec(BaseModel):
    format: str = Field(..., description="jpg/png 등")
    name: str = Field(..., description="이미지 식별 이름")


# FastAPI to OCR API model
class ClovaOCRRequest(BaseModel):
    images: List[ClovaImageSpec]
    requestId: str
    version: str
    timestamp: int


class ExtractedMenu(BaseModel):
    name: str = Field(..., description="메뉴 이름")
    price: Optional[int] = Field(None, description="메뉴 가격 (null 허용)")


# Polling result respond (GET /api/menu-extraction/{assetId}/result)
class MenuExtractionResultResponse(BaseModel):
    code: Literal["MENUBOARD_PENDING", "MENUBOARD_SUCCESS", "MENUBOARD_FAIL"] = Field(
        ..., description="처리 상태 코드"
    )
    message: str = Field(..., description="처리 상태 메시지")
    status: int = Field(..., description="HTTP 유사 상태 코드 숫자")
    extractedMenus: Optional[List[ExtractedMenu]] = Field(
        None, description="추출된 메뉴 목록 (SUCCESS 시에만 포함)"
    )
    timestamp: datetime = Field(..., description="응답 생성 시간(ISO8601)")



