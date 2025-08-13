"""
영수증 OCR 서비스 (Clova 호출 + 결과 파싱)
콜백/Redis 연동 제거 버전
"""

from __future__ import annotations

import json
import os
import time
import uuid
from typing import Optional, Tuple, Dict, Any

import httpx
from dotenv import load_dotenv


load_dotenv()


class ReceiptOCRService:
    def __init__(self) -> None:
        self.secret_key = os.getenv("CLOVA_RECEIPT_SECRET_KEY")
        self.api_url = os.getenv("CLOVA_RECEIPT_API_URL")

    def is_available(self) -> bool:
        return bool(self.secret_key and self.api_url)

    @staticmethod
    def _normalize_format(fmt: str) -> str:
        fmt = (fmt or "").strip().lower()
        mapping = {"jpeg": "jpg", "tif": "tiff"}
        return mapping.get(fmt, fmt)

    async def call_clova_receipt(self, image_data: bytes, image_format: str) -> Dict[str, Any]:
        fmt = self._normalize_format(image_format)
        if fmt not in {"jpg", "png", "pdf", "tiff"}:
            raise ValueError(
                f"지원하지 않는 이미지 형식입니다: {image_format}. 지원 형식: ['jpg','png','pdf','tiff']"
            )

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
        try:
            image0 = (ocr_json or {}).get("images", [{}])[0]
            infer = (image0 or {}).get("inferResult")
        except Exception:
            infer = None

        result = "FAIL"
        if isinstance(infer, str) and infer.upper() == "SUCCESS":
            result = "SUCCESS"

        extracted = None
        try:
            receipt = image0.get("receipt", {})
            result_obj = receipt.get("result", {})
            store_info = result_obj.get("storeInfo", {})
            addresses = store_info.get("addresses")
            if isinstance(addresses, list) and addresses:
                text = addresses[0].get("text") if isinstance(addresses[0], dict) else None
                if isinstance(text, str):
                    extracted = text
            elif isinstance(addresses, dict):
                text = addresses.get("text")
                if isinstance(text, str):
                    extracted = text
        except Exception:
            extracted = None

        return result, extracted


receipt_ocr_service = ReceiptOCRService()


