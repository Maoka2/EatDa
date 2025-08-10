"""
FastAPI 애플리케이션 진입점
AI API 서버의 메인 실행 파일입니다.
"""
import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

# 라우터 임포트
from routers import generate_router, ocr_router, ocr_receipt_router

# 환경 변수 로드
load_dotenv()

# FastAPI 애플리케이션 초기화
app = FastAPI(
    title="AI API",
    description="AI API 서버",
    version="1.0.0"
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
app.include_router(generate_router)
app.include_router(ocr_router)
app.include_router(ocr_receipt_router)

# API 서버 상태 확인(루트 페이지)
@app.get("/609")
async def root():
    return {"message": "AI API Server is running"}

# 헬스 체크 엔드포인트
@app.get("/health")
async def health_check():
    return {"status": "healthy"}

# 서버 실행 (개발용)
if __name__ == "__main__":
    import uvicorn
    print("🚀 AI Video Generation API 서버를 시작합니다...")
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)