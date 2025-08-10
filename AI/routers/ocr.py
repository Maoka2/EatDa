"""
OCR 관련 API 라우터
메뉴보드 이미지 OCR 처리를 위한 분리된 엔드포인트들을 담당합니다.
"""

import httpx
from fastapi import APIRouter, HTTPException, UploadFile, File, BackgroundTasks, Form
from models.ocr_menuboard_models import OCRMenuRequest, OCRMenuRespond, OCRCallbackRequest
from services import ocr_menuboard_service, callback_service

# 라우터 생성
router = APIRouter(
    prefix="ai/api",
    tags=["ocr"]
)

# 메모리에 OCR 요청 저장 (추후 DB로 이관 고려)
ocr_requests = {}


@router.post("/reviews/menu-extraction", response_model=dict)
async def receive_ocr_request(request: OCRMenuRequest, background_tasks: BackgroundTasks):
    """
    1단계: RN → FastAPI
    메뉴보드 OCR 요청을 받아서 비동기 처리를 시작합니다.
    """
    try:
        if not ocr_menuboard_service.is_available():
            raise HTTPException(
                status_code=500,
                detail="OCR 서비스가 초기화되지 않았습니다. API 키를 확인하세요."
            )

        # 요청 정보를 메모리에 저장
        ocr_requests[request.sourceId] = {
            "request": request,
            "status": "PROCESSING",
            "created_at": request.requestedAt
        }

        # 백그라운드에서 OCR 처리 시작
        background_tasks.add_task(process_ocr_async, request)

        return {
            "message": "OCR 요청이 접수되었습니다.",
            "sourceId": request.sourceId,
            "status": "PROCESSING"
        }

    except Exception as e:
        print(f"❌ OCR 요청 접수 실패: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"OCR 요청 처리 실패: {e}"
        )


async def process_ocr_async(request: OCRMenuRequest):
    """
    2단계: FastAPI → Clova OCR (비동기 처리)
    백그라운드에서 실제 OCR 처리를 수행하고 콜백을 전송합니다.
    """
    try:
        # 1단계: 이미지 URL에서 이미지 다운로드
        async with httpx.AsyncClient() as client:
            img_response = await client.get(str(request.imageUrl))
            img_response.raise_for_status()
            image_data = img_response.content

        # 이미지 포맷 추출 (URL 확장자 기반)
        image_format = "jpg"  # 기본값
        url_path = str(request.imageUrl).lower()
        if any(url_path.endswith(ext) for ext in ('.jpg', '.jpeg', '.png', '.pdf', '.tif', '.tiff')):
            image_format = url_path.split('.')[-1]
        # 정규화는 서비스 내부에서 처리됨 (jpeg->jpg, tif->tiff)

        # 2단계: OCR 처리
        extracted_menus = await ocr_menuboard_service.extract_menus_from_image(
            image_data, image_format
        )

        # 3단계: 콜백 데이터 구성 (성공)
        callback_data = OCRCallbackRequest(
            sourceId=request.sourceId,
            result="SUCCESS",
            extractedMenus=extracted_menus,
            type=request.type
        )

        # 4단계: 고정 콜백 엔드포인트에 전송
        await send_ocr_callback(callback_data)

        # 메모리 상태 업데이트
        if request.sourceId in ocr_requests:
            ocr_requests[request.sourceId]["status"] = "SUCCESS"

    except httpx.HTTPError as e:
        print(f"❌ 이미지 다운로드 실패: {e}")
        await handle_ocr_failure(request, f"이미지 다운로드 실패: {e}")
    
    except Exception as e:
        print(f"❌ OCR 처리 실패: {e}")
        await handle_ocr_failure(request, f"OCR 처리 실패: {e}")


async def handle_ocr_failure(request: OCRMenuRequest, error_message: str):
    """OCR 실패 시 콜백 처리"""
    try:
        # 실패 콜백 데이터 구성
        callback_data = OCRCallbackRequest(
            sourceId=request.sourceId,
            result="FAIL",
            extractedMenus=[],
            type=request.type
        )

        # 고정 콜백 엔드포인트에 실패 전송
        await send_ocr_callback(callback_data)

        # 메모리 상태 업데이트
        if request.sourceId in ocr_requests:
            ocr_requests[request.sourceId]["status"] = "FAIL"
            ocr_requests[request.sourceId]["error"] = error_message

    except Exception as callback_error:
        print(f"❌ 실패 콜백 전송 중 오류: {callback_error}")


async def send_ocr_callback(callback_data: OCRCallbackRequest):
    """
    3단계: FastAPI → 고정 콜백 엔드포인트
    OCR 처리 결과를 지정된 콜백 엔드포인트로 전송합니다.
    """
    try:
        # TODO[SPRING]: RN 서버 도메인/포트로 변경
        callback_url = "https://i13a609.p.ssafy.io/api/reviews/menu-extraction/callback"
        
        async with httpx.AsyncClient() as client:
            response = await client.post(
                callback_url,
                json=callback_data.model_dump(),
                headers={"Content-Type": "application/json"}
            )
            response.raise_for_status()
            
            print(f"✅ OCR 콜백 전송 성공: sourceId={callback_data.sourceId}, result={callback_data.result}")
            return response.json()

    except Exception as e:
        print(f"❌ OCR 콜백 전송 실패: {e}")
        raise




@router.post("/ocr/menu-board/upload", response_model=OCRMenuRespond)
async def process_menu_board_upload(
    sourceId: int = Form(...),
    file: UploadFile = File(...)
):
    """
    테스트용 엔드포인트: 파일 업로드를 통한 메뉴보드 이미지 OCR 처리
    개발 및 디버깅 용도로만 사용
    
    postman test method : post
    url : http://localhost:8000/api/ocr/menu-board/upload
    body : form-data
    - sourceId: 123
    - file: [이미지 파일 선택]
    """
    try:
        if not ocr_menuboard_service.is_available():
            raise HTTPException(
                status_code=500,
                detail="OCR 서비스가 초기화되지 않았습니다. API 키를 확인하세요."
            )

        # 파일 타입 검증
        if not file.content_type or not file.content_type.startswith('image/'):
            raise HTTPException(
                status_code=400,
                detail="이미지 파일만 업로드 가능합니다."
            )

        # 이미지 데이터 읽기
        image_data = await file.read()
        
        # 이미지 포맷 추출 (Content-Type 및 파일명 기반)
        image_format = "jpg"  # 기본값
        ct = (file.content_type or "").lower()
        if ct in ("image/jpeg", "image/jpg"):
            image_format = "jpg"
        elif ct == "image/png":
            image_format = "png"
        elif ct in ("image/tiff", "image/tif"):
            image_format = "tiff"
        elif ct == "application/pdf":
            image_format = "pdf"
        else:
            # Content-Type에서 판별되지 않으면 파일명 확장자 사용
            filename = (file.filename or "").lower()
            if any(filename.endswith(ext) for ext in ('.jpg', '.jpeg', '.png', '.pdf', '.tif', '.tiff')):
                image_format = filename.split('.')[-1]

        # OCR 처리
        extracted_menus = await ocr_menuboard_service.extract_menus_from_image(
            image_data, image_format
        )

        # 응답 구성
        return OCRMenuRespond(
            sourceId=sourceId,
            result="SUCCESS",
            extractedMenus=extracted_menus
        )

    except Exception as e:
        print(f"❌ 테스트 OCR 처리 실패: {e}")
        return OCRMenuRespond(
            sourceId=sourceId,
            result="FAIL",
            extractedMenus=[]
        )