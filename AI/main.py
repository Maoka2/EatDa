"""
FastAPI 애플리케이션 진입점
AI API 서버의 메인 실행 파일입니다.
"""
import os
from fastapi import FastAPI
from contextlib import asynccontextmanager
import asyncio
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
<<<<<<< HEAD
<<<<<<< Updated upstream
=======
import logging
from starlette.staticfiles import StaticFiles
>>>>>>> Stashed changes
=======
import logging
>>>>>>> ai/master

# 라우터 임포트
from routers import stream_test_router, menuboard_ocr_router, receipt_ocr_router
from consumers.event_image_consumer import EventImageConsumer
from consumers.menuboard_generate_consumer import MenuboardGenerateConsumer
from consumers.review_generate_consumer import ReviewGenerateConsumer

# 환경 변수 로드
load_dotenv()

# 타임스탬프 포함 로깅 포맷 설정 (모든 로거 공통)
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s %(levelname)s:%(name)s:%(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
)

# httpx 로거도 동일 포맷/레벨로 노출
logging.getLogger("httpx").setLevel(logging.INFO)
logger = logging.getLogger(__name__)

@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("✅ AI Server starting...")
    tasks = [
        asyncio.create_task(EventImageConsumer().run_forever(), name="event-image"),
        asyncio.create_task(MenuboardGenerateConsumer().run_forever(), name="menuboard-generate"),
        asyncio.create_task(ReviewGenerateConsumer().run_forever(), name="review-generate"),
    ]
    app.state.consumer_tasks = tasks
    logger.info("✅ AI Server started and ready")
    try:
        yield
    finally:
        for t in tasks:
            t.cancel()
        await asyncio.gather(*tasks, return_exceptions=True)
        logger.info("🛑 Consumers cancelled and cleaned up")

# FastAPI 애플리케이션 초기화
app = FastAPI(
    title="AI API",
    description="AI API 서버",
    version="1.0.0",
    root_path="/ai",
    lifespan=lifespan,
)

# CORS 설정 (프론트엔드에서 접근할 수 있도록) - 개발용(테스트)이라 대부분 허용
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],        # 모든 출처 허용
    allow_credentials=True,     # 인증 정보 허용(쿠키 / authorization 헤더 포함)
    allow_methods=["*"],        # 모든 메서드 허용(GET, POST, PUT, DELETE, OPTIONS 등)
    allow_headers=["*"],        # 모든 헤더 허용
)

# 라우터 등록
app.include_router(stream_test_router)
app.include_router(menuboard_ocr_router)
app.include_router(receipt_ocr_router)

# 정적 파일(생성된 이미지) 서비스 경로 마운트
asset_dir = os.getenv(
    "AI_ASSET_DIR",
    os.path.abspath(os.path.join(os.path.dirname(__file__), "assets")),
)
try:
    os.makedirs(asset_dir, exist_ok=True)
except Exception:
    pass
app.mount("/assets", StaticFiles(directory=asset_dir), name="assets")

# API 서버 상태 확인(루트 페이지)
@app.get("/609")
async def root():
    return {"message": "AI API Server is running"}

# 헬스 체크 엔드포인트
@app.get("/health")
async def health_check():
    return {"status": "healthy"}


<<<<<<< HEAD
<<<<<<< Updated upstream
# 백그라운드로 이벤트 에셋 Redis consumer 구동
# 서버가 켜지눈 순갑누터 stream 데이터를 비동기 구독하여 즉시 처리
@app.on_event("startup")
async def startup_event():
    # 이벤트 에셋 (event_image)
    asyncio.create_task(EventImageConsumer().run_forever())
    # 메뉴 포스터 (menuboard_generate)
    asyncio.create_task(MenuboardGenerateConsumer().run_forever())
    # 영수증 OCR (receipt_ocr)
    asyncio.create_task(ReceiptOCRConsumer().run_forever())
    # 리뷰 생성 (review_generate)
    asyncio.create_task(ReviewGenerateConsumer().run_forever())
=======
# # 백그라운드로 이벤트 에셋 Redis consumer 구동
# # 서버가 켜지눈 순간부터 stream 데이터를 비동기 구독하여 즉시 처리
# @app.on_event("startup")
# async def startup_event():
#     logger.info("✅ AI Server started and ready")
#     # 이벤트 에셋 (event_image)
#     asyncio.create_task(EventImageConsumer().run_forever())
#     # 메뉴 포스터 (menuboard_generate)
#     asyncio.create_task(MenuboardGenerateConsumer().run_forever())
#     # 리뷰 생성 (review_generate)
#     asyncio.create_task(ReviewGenerateConsumer().run_forever())
>>>>>>> ai/master

=======
>>>>>>> Stashed changes
# 서버 실행 (개발용)
if __name__ == "__main__":
    import uvicorn
    print("🚀 AI Video Generation API 서버를 시작합니다...")
    # 컨테이너/서버 환경에서는 reload를 사용하지 않습니다(백그라운드 task 파괴 방지)
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=False)