"""
OCR 영수증 주소 추출 라우터
 - HTTP 업로드 테스트 및 URL 다운로드형 처리 엔드포인트 제공
 - 실제 운영은 Redis Consumer에서 트리거될 수 있으나, API 테스트를 위해 HTTP 엔드포인트도 유지
"""

from __future__ import annotations

import httpx
from fastapi import APIRouter, HTTPException, UploadFile, File, Form
from models.ocr_receipt_models import OCRReceiptCallbackRequest
from services.ocr_receipt_service import ocr_receipt_service


router = APIRouter(prefix="/api/ocr", tags=["ocr-receipt"])


@router.post("/receipt/url")
async def process_receipt_by_url(
    sourceId: int = Form(...),
    imageUrl: str = Form(...),
):
    if not ocr_receipt_service.is_available():
        raise HTTPException(500, detail="CLOVA_RECEIPT_* 환경변수를 확인하세요.")

    # 이미지 다운로드 + 확장자 추출
    async with httpx.AsyncClient() as client:
        resp = await client.get(imageUrl)
        resp.raise_for_status()
        image_data = resp.content

    fmt = ocr_receipt_service.detect_image_format_from_url(imageUrl) or "jpg"
    ocr_json = await ocr_receipt_service.call_clova_receipt(image_data, fmt)
    result, address = ocr_receipt_service.parse_infer_result(ocr_json)

    callback = OCRReceiptCallbackRequest(
        sourceId=sourceId,
        result=result,
        extractedAddress=address,
    )
    cb_resp = await ocr_receipt_service.send_callback(callback)
    return {"callback": cb_resp, "result": result, "address": address}


@router.post("/receipt/upload")
async def process_receipt_by_upload(
    sourceId: int = Form(...),
    file: UploadFile = File(...),
):
    if not ocr_receipt_service.is_available():
        raise HTTPException(500, detail="CLOVA_RECEIPT_* 환경변수를 확인하세요.")

    image_data = await file.read()

    # Content-Type/파일명에서 포맷 판별
    fmt = "jpg"
    ct = (file.content_type or "").lower()
    if ct in ("image/jpeg", "image/jpg"):
        fmt = "jpg"
    elif ct == "image/png":
        fmt = "png"
    elif ct in ("image/tiff", "image/tif"):
        fmt = "tiff"
    elif ct == "application/pdf":
        fmt = "pdf"
    else:
        name = (file.filename or "").lower()
        if name.endswith((".jpg", ".jpeg", ".png", ".pdf", ".tif", ".tiff")):
            fmt = name.split(".")[-1]

    ocr_json = await ocr_receipt_service.call_clova_receipt(image_data, fmt)
    result, address = ocr_receipt_service.parse_infer_result(ocr_json)

    callback = OCRReceiptCallbackRequest(
        sourceId=sourceId,
        result=result,
        extractedAddress=address,
    )
    cb_resp = await ocr_receipt_service.send_callback(callback)
    return {"callback": cb_resp, "result": result, "address": address}


