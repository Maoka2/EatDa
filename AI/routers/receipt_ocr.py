"""
영수증 OCR 인증 엔드포인트 (RN 연동)
 - POST /ai/api/reviews/ocr-verification: 파일을 받아 OCR 인증 요청 등록, 12자리 숫자 assetId 반환
 - GET  /ai/api/reviews/ocr-verification/{assetId}/result: 폴링으로 처리 상태/결과를 조회
"""

from datetime import datetime, timezone
from typing import Dict
import secrets

from fastapi import APIRouter, BackgroundTasks, File, HTTPException, UploadFile

from models.receipt_ocr_models import (
    OCRReceiptRequest,
    ReceiptOCRRespond,
    ReceiptVerificationResultResponse,
)
from services.receipt_ocr_service import receipt_ocr_service


router = APIRouter(prefix="/api/reviews", tags=["receipt_ocr"])


_requests_state: Dict[str, Dict] = {}


@router.post("/ocr-verification", response_model=ReceiptOCRRespond)
async def create_receipt_ocr_request(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
):
    """
    영수증 이미지 파일을 받아 12자리 숫자 assetId를 즉시 반환하고,
    OCR 처리는 백그라운드에서 실행합니다.
    """
    if not receipt_ocr_service.is_available():
        raise HTTPException(status_code=500, detail="OCR 서비스가 초기화되지 않았습니다. API 키를 확인하세요.")

    # 12자리 숫자를 생성하는 함수 (항상 12자리, 첫 자리는 1-9)
    def _generate_12_digit_id() -> int:
        # 범위: 100_000_000_000 ~ 999_999_999_999
        return secrets.randbelow(9 * 10**11) + 10**11

    asset_id = _generate_12_digit_id()
    while str(asset_id) in _requests_state:
        asset_id = _generate_12_digit_id()

    # 요청 상태 초기화
    _requests_state[str(asset_id)] = {
        "status": "PENDING",
        "created_at": datetime.now(timezone.utc),
        "result": "PENDING",
        "error": None,
    }

    # 업로드 파일 즉시 검증/읽기 (응답 후 UploadFile 핸들 무효화 방지)
    if not file.content_type or not file.content_type.startswith("image/"):
        return ReceiptOCRRespond(
            code="RECEIPT_REQUESTED_FAILED",
            message="이미지 파일만 업로드 가능합니다.",
            status=400,
            assetId=None,
            timestamp=datetime.now(timezone.utc),
        )

    image_bytes = await file.read()
    image_format = "jpg"
    content_type = (file.content_type or "").lower()
    if content_type in ("image/jpeg", "image/jpg"):
        image_format = "jpg"
    elif content_type == "image/png":
        image_format = "png"
    elif content_type in ("image/tiff", "image/tif"):
        image_format = "tiff"
    elif content_type == "application/pdf":
        image_format = "pdf"
    else:
        filename = (file.filename or "").lower()
        if any(filename.endswith(ext) for ext in (".jpg", ".jpeg", ".png", ".pdf", ".tif", ".tiff")):
            image_format = filename.split(".")[-1]

    req_model = OCRReceiptRequest(file=image_bytes)
    background_tasks.add_task(_process_receipt_from_request, str(asset_id), req_model, image_format)

    return ReceiptOCRRespond(
        code="RECEIPT_REQUESTED",
        message="영수증 인증 요청이 등록되었습니다.",
        status=200,
        assetId=asset_id,
        timestamp=datetime.now(timezone.utc),
    )


@router.get("/ocr-verification/{assetId}/result", response_model=ReceiptVerificationResultResponse)
async def get_receipt_ocr_result(assetId: int):
    key = str(assetId)
    state = _requests_state.get(key)
    if state is None:
        raise HTTPException(status_code=404, detail="assetId not found")

    now = datetime.now(timezone.utc)
    status = state.get("status")
    result = state.get("result", "PENDING")

    if status == "PENDING":
        return ReceiptVerificationResultResponse(
            code="RECEIPT_PENDING",
            message="영수증 인증이 아직 처리 중입니다.",
            status=201,
            result="PENDING",
            timestamp=now,
        )
    if status == "SUCCESS":
        return ReceiptVerificationResultResponse(
            code="RECEIPT_SUCCESS",
            message="영수증 인증이 완료되었습니다.",
            status=200,
            result="SUCCESS",
            timestamp=now,
        )
    if status == "FAIL":
        return ReceiptVerificationResultResponse(
            code="RECEIPT_FAILED",
            message="영수증 인증에 실패했습니다..",
            status=400,
            result="FAIL",
            timestamp=now,
        )
    # 알 수 없는 상태 처리
    raise HTTPException(status_code=500, detail="Unknown status")


async def _process_receipt_from_request(asset_id: str, request: OCRReceiptRequest, image_format: str):
    try:
        image_bytes = request.file or b""
        ocr_json = await receipt_ocr_service.call_clova_receipt(image_bytes, image_format)
        result, extracted = receipt_ocr_service.parse_infer_result(ocr_json)
        if result == "SUCCESS":
            _requests_state[asset_id]["status"] = "SUCCESS"
            _requests_state[asset_id]["result"] = "SUCCESS"
        else:
            _requests_state[asset_id]["status"] = "FAIL"
            _requests_state[asset_id]["result"] = "FAIL"
    except Exception as e:
        _requests_state[asset_id]["status"] = "FAIL"
        _requests_state[asset_id]["result"] = "FAIL"
        _requests_state[asset_id]["error"] = str(e)


