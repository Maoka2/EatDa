"""
메뉴판 OCR 엔드포인트 (RN 연동)
 - POST /ai/api/menu-extraction: imageUrl 또는 파일을 받아 OCR 처리 요청을 등록하고 12자리 숫자 assetId를 반환
 - GET  /ai/api/menu-extraction/{assetId}/result: 폴링으로 처리 상태/결과를 조회
"""

from datetime import datetime, timezone
from typing import Dict, Optional, List
import secrets

from fastapi import APIRouter, BackgroundTasks, File, HTTPException, UploadFile

from models.menuboard_ocr_models import (
    OCRMenuRequest,
    OCRMenuRespond,
    MenuExtractionResultResponse,
    ExtractedMenu,
)
from services.menuboard_ocr_service import menuboard_ocr_service


router = APIRouter(prefix="/api", tags=["menuboard_ocr"])


# 메모리 기반 요청 상태 저장소 
_requests_state: Dict[str, Dict] = {}


@router.post("/menu-extraction", response_model=OCRMenuRespond)
async def create_menu_extraction_request(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
):
    """
    이미지 파일을 받아 12자리 숫자 assetId를 즉시 반환하고,
    OCR 처리는 백그라운드에서 실행합니다.
    """
    if not menuboard_ocr_service.is_available():
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
        "extracted_menus": None,
        "error": None,
    }

    # 업로드 파일 즉시 검증/읽기 (응답 후 UploadFile 핸들 무효화 방지)
    if not file.content_type or not file.content_type.startswith("image/"):
        return OCRMenuRespond(
            code="MENUBOARD_REQUESTED_FAILED",
            message="이미지 파일만 업로드 가능합니다.",
            status=400,
            assetId=None,
            timestamp=datetime.now(timezone.utc),
        )

    image_bytes = await file.read()

    # 업로드된 파일 바이트로 요청 모델 구성 (스키마 참조 목적)
    req_model = OCRMenuRequest(file=image_bytes)

    # 이미지 포맷 확인
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

    background_tasks.add_task(_process_ocr_from_request, str(asset_id), req_model, image_format)

    return OCRMenuRespond(
        code="MENUBOARD_REQUESTED",
        message="메뉴판 추출 요청이 등록되었습니다.",
        status=200,
        assetId=asset_id,
        timestamp=datetime.now(timezone.utc),
    )


@router.get("/menu-extraction/{assetId}/result", response_model=MenuExtractionResultResponse)
async def get_menu_extraction_result(assetId: int):
    key = str(assetId)
    state = _requests_state.get(key)
    if state is None:
        raise HTTPException(status_code=404, detail="assetId not found")

    now = datetime.now(timezone.utc)
    status = state.get("status")
    extracted: Optional[List[ExtractedMenu]] = state.get("extracted_menus")

    if status == "PENDING":
        return MenuExtractionResultResponse(
            code="MENUBOARD_PENDING",
            message="메뉴판 추출이 아직 처리 중입니다.",
            status=201,
            extractedMenus=None,
            timestamp=now,
        )
    if status == "SUCCESS":
        return MenuExtractionResultResponse(
            code="MENUBOARD_SUCCESS",
            message="메뉴판 추출이 완료되었습니다.",
            status=200,
            extractedMenus=extracted,
            timestamp=now,
        )
    if status == "FAIL":
        return MenuExtractionResultResponse(
            code="MENUBOARD_FAIL",
            message="메뉴판 추출이 실패했습니다.",
            status=400,
            extractedMenus=None,
            timestamp=now,
        )

    # 알 수 없는 상태 처리
    raise HTTPException(status_code=500, detail="Unknown status")


async def _process_ocr_from_bytes(asset_id: str, image_bytes: bytes, image_format: str):
    try:
        extracted = await menuboard_ocr_service.extract_menus_from_image(image_bytes, image_format)
        _requests_state[asset_id]["status"] = "SUCCESS"
        _requests_state[asset_id]["extracted_menus"] = extracted
    except Exception as e:
        _requests_state[asset_id]["status"] = "FAIL"
        _requests_state[asset_id]["error"] = str(e)


async def _process_ocr_from_request(asset_id: str, request: OCRMenuRequest, image_format: str):
    """
    OCRMenuRequest 모델을 참조하여 백그라운드에서 OCR 처리 수행
    """
    try:
        image_bytes = request.file or b""
        extracted = await menuboard_ocr_service.extract_menus_from_image(image_bytes, image_format)
        _requests_state[asset_id]["status"] = "SUCCESS"
        _requests_state[asset_id]["extracted_menus"] = extracted
    except Exception as e:
        _requests_state[asset_id]["status"] = "FAIL"
        _requests_state[asset_id]["error"] = str(e)

