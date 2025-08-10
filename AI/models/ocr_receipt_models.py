"""
OCR 영수증 인증 요청 모델 (Redis Stream 용)

- Stream Key: "ocr.verification.request"
- 메시지 스키마는 스펙 문서에 명시된 필드를 그대로 따릅니다.

추가 유틸
- XADD에 사용하기 쉬운 필드 변환 헬퍼 제공 (JSON 단일 필드 or KV 전송)
"""

from __future__ import annotations

from datetime import datetime
from typing import Dict, Literal, Optional

from pydantic import BaseModel, Field, HttpUrl


STREAM_KEY_OCR_RECEIPT_REQUEST: str = "ocr.verification.request"

# Redis Stream에 적재/소비되는 OCR 영수증 인증 요청 메시지 모델.
class OCRReceiptVerificationMessage(BaseModel):
    sourceId: int = Field(..., description="OCR 요청 식별자 (asset_source.id)")
    storeId: int = Field(..., description="인증 대상 가게 ID")
    userId: int = Field(..., description="요청 사용자 ID")
    imageUrl: HttpUrl = Field(..., description="업로드된 영수증 이미지 URL")
    requestedAt: datetime = Field(..., description="요청 시각 (ISO8601)")
    expireAt: datetime = Field(..., description="만료 시각 (ISO8601)")
    retryCount: int = Field(0, description="재시도 횟수 (기본 0)")

    def to_xadd_fields(self, mode: Literal["json", "kv"] = "json") -> Dict[str, str]:
        """Redis XADD 호출에 사용할 필드 딕셔너리를 생성.

        - mode="json": 단일 필드("payload")에 전체 JSON 직렬화하여 전달
        - mode="kv": 각 필드를 개별 KV로 전달 (모두 문자열)
        """
        if mode == "json":
            return {"payload": self.model_dump_json()}

        # kv 모드: datetime은 ISO8601 문자열로 변환
        data = self.model_dump()
        data["requestedAt"] = self.requestedAt.isoformat()
        data["expireAt"] = self.expireAt.isoformat()
        # 모든 값을 str로 캐스팅 (Redis 필드는 바이트/문자열이어야 함)
        return {k: str(v) for k, v in data.items()}

# Spring 콜백으로 전송할 모델 (POST /api/reviews/ocr-verification/callback)
class OCRReceiptCallbackRequest(BaseModel):
    """
    - result: SUCCESS | FAIL
    - extractedAddress: null 허용 (실패시)
    """

    sourceId: int = Field(..., description="OCR 요청 식별자 (asset_source.id)")
    result: Literal["SUCCESS", "FAIL"] = Field(..., description="생성 결과")
    extractedAddress: Optional[str] = Field(
        None, description="OCR로 추출된 주소 문자열 (실패시 null)"
    )


__all__ = [
    "STREAM_KEY_OCR_RECEIPT_REQUEST",
    "OCRReceiptVerificationMessage",
    "OCRReceiptCallbackRequest",
]