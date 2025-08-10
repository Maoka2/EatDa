"""
OCR 영수증 주소 추출 서비스
 - Redis Stream 또는 HTTP 트리거를 통해 이미지를 받아 Naver Clova Receipt OCR 호출
 - inferResult를 SUCCESS/FAIL로 매핑하고, 주소를 파싱하여 콜백 전송
"""

from __future__ import annotations

import json
import os
import time
import uuid
import re
from typing import Optional, Tuple, Dict, Any

import httpx
from dotenv import load_dotenv

from models.ocr_receipt_models import OCRReceiptCallbackRequest


load_dotenv()


class OCRReceiptService:
    def __init__(self) -> None:
        self.secret_key = os.getenv("CLOVA_RECEIPT_SECRET_KEY")
        self.api_url = os.getenv("CLOVA_RECEIPT_API_URL")
        # Spring 콜백 URL (영수증 검증)
        self.callback_url = os.getenv(
            "SPRING_OCR_RECEIPT_CALLBACK_URL",
            "https://i13a609.p.ssafy.io/ai/api/reviews/ocr-verification/callback",
        )

    def is_available(self) -> bool:
        return bool(self.secret_key and self.api_url)

    @staticmethod
    def _normalize_format(fmt: str) -> str:
        fmt = (fmt or "").strip().lower()
        mapping = {"jpeg": "jpg", "tif": "tiff"}
        return mapping.get(fmt, fmt)

    @staticmethod
    def detect_image_format_from_url(url: str) -> Optional[str]:
        lower = (url or "").lower()
        for ext in (".jpg", ".jpeg", ".png", ".pdf", ".tif", ".tiff"):
            if lower.endswith(ext):
                return ext.split(".")[-1]
        return None

    async def call_clova_receipt(self, image_data: bytes, image_format: str) -> Dict[str, Any]:
        fmt = self._normalize_format(image_format)
        if fmt not in {"jpg", "png", "pdf", "tiff"}:
            raise ValueError(
                f"지원하지 않는 이미지 형식입니다: {image_format}. 지원 형식: ['jpg','png','pdf','tiff']"
            )

        # 이거 redis stream 호출 하면서 받는 데이터가 적용이 안되는 느낌이다
        # requestID랑 전반적으로 넘어오는 데이터 처리하는건지 확인
        request_json = {
            "images": [{"format": fmt, "name": "demo"}],
            "requestId": str(uuid.uuid4()),
            "version": "V2",
            "timestamp": int(round(time.time() * 1000)),
        }

        files = [("file", image_data)]
        payload = {"message": json.dumps(request_json).encode("utf-8")}
        headers = {"X-OCR-SECRET": self.secret_key}

        async with httpx.AsyncClient() as client:
            resp = await client.post(self.api_url, headers=headers, data=payload, files=files)
            resp.raise_for_status()
            return resp.json()

    @staticmethod
    def parse_infer_result(ocr_json: Dict[str, Any]) -> Tuple[str, Optional[str]]:
        """inferResult와 주소를 파싱한다.
        - inferResult: SUCCESS | FAILURE | ERROR → SUCCESS | FAIL 로 변환
        - 주소: images[0].receipt.result.storeInfo.addresses[0].text (없으면 None)
        """
        try:
            image0 = (ocr_json or {}).get("images", [{}])[0]
            infer = (image0 or {}).get("inferResult")
        except Exception:
            infer = None

        result = "FAIL"
        if isinstance(infer, str) and infer.upper() == "SUCCESS":
            result = "SUCCESS"

        # 주소 추출
        extracted = None
        try:
            receipt = image0.get("receipt", {})
            result_obj = receipt.get("result", {})
            store_info = result_obj.get("storeInfo", {})
            addresses = store_info.get("addresses")
            if isinstance(addresses, list) and addresses:
                # 첫 항목에서 text 추출
                
                text = addresses[0].get("text") if isinstance(addresses[0], dict) else None
                if isinstance(text, str):
                    extracted = text
            elif isinstance(addresses, dict):
                # 단일 객체 형태일 수도 있음
                text = addresses.get("text")
                if isinstance(text, str):
                    extracted = text
        except Exception:
            extracted = None

        return result, extracted

    async def send_callback(self, callback: OCRReceiptCallbackRequest) -> Dict[str, Any]:
        async with httpx.AsyncClient() as client:
            resp = await client.post(
                self.callback_url,
                json=callback.model_dump(),
                headers={"Content-Type": "application/json"},
            )
            # 콜백 수신 서버의 응답 JSON을 그대로 반환 (테스트 용이)
            try:
                return resp.json()
            except Exception:
                return {"status": resp.status_code}


# 전역 인스턴스.
ocr_receipt_service = OCRReceiptService()


