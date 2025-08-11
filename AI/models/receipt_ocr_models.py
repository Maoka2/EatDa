"""
OCR 영수증 인증 요청 모델 (Redis Stream 용)
기존 ocr_receipt_models 를 대체
"""

from __future__ import annotations

from datetime import datetime
from typing import Literal, Optional

from pydantic import BaseModel, Field


class OCRReceiptRequest(BaseModel):
    file: Optional[bytes] = Field(None, description="업로드된 영수증 이미지 파일")

class ReceiptOCRRespond(BaseModel):
    code: Literal["RECEIPT_REQUESTED", "RECEIPT_REQUESTED_FAILED"] = Field(..., description="응답 코드")
    message: str = Field(..., description="응답 메시지")
    status: int = Field(..., description="HTTP 유사 상태 코드 숫자")
    assetId: Optional[int] = Field(None, description="OCR 요청 식별자(12자리 숫자, 성공 시 포함)")
    timestamp: datetime = Field(..., description="응답 생성 시간(ISO8601)")


class ReceiptVerificationResultResponse(BaseModel):
    code: Literal["RECEIPT_PENDING", "RECEIPT_SUCCESS", "RECEIPT_FAILED"] = Field(..., description="처리 상태 코드")
    message: str = Field(..., description="처리 상태 메시지")
    status: int = Field(..., description="HTTP 유사 상태 코드 숫자")
    result: Literal["PENDING", "SUCCESS", "FAIL"] = Field(..., description="처리 결과 요약")
    timestamp: datetime = Field(..., description="응답 생성 시간(ISO8601)")



