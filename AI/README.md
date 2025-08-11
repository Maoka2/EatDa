# AI FastAPI 서버 실행 가이드

## 폴더 구조 (리팩토링 반영)
receipt_ocr : 영수증 인식 OCR 관련 파일 - 리뷰 생성 시 사용
menuboard_ocr : 메뉴판 인식 OCR 관련 파일 - 사장님 회원가입 시 사용 (RN)

event_image : 아밴트 포스터 생성 관련 파일  
menuboard_generate : 메뉴판 이미지 생성 관련 파일  

review_generate : 리뷰 생성(쇼츠, 이미지 생성)  

```
AI/
├── main.py                              # FastAPI 앱 진입점 (startup에 Redis 소비자 자동 구동)
├── consumers/                           # Redis Streams 소비자
│   ├── event_image_consumer.py             # event.asset.generate → IMAGE/SHORTS 처리 + 이벤트 이미지 콜백
│   ├── menuboard_generate_consumer.py      # menu.poster.generate → IMAGE 처리 + 포스터 콜백
│   ├── receipt_ocr_consumer.py             # ocr.verification.request → 영수증 OCR 처리
│   └── review_generate_consumer.py         # review.asset.generate → IMAGE/SHORTS 처리 + 리뷰 콜백
├── routers/                             # HTTP API (RN 통신용)
│   ├── generate.py                         # 리뷰 생성 테스트용 HTTP 
│   └── stream_test.py 
엔드포인트
│   ├── ocr.py                              # 메뉴보드 OCR (RN → FastAPI → Spring 콜백)
│   └── ocr_receipt.py                      # 영수증 주소 OCR (테스트/보조)
├── services/                            # 서비스 계층
│   ├── image_service.py                    # DALL·E 3 (GMS 프록시) 이미지 생성
│   ├── luma_service.py                     # Luma(ray-2) 영상 생성/폴링
│   ├── runway_service.py                   # Runway(gen4_turbo) 영상 생성/폴링
│   ├── gpt_service.py                      # 프롬프트 보강
│   ├── review_generate_callback.py         # 리뷰 생성 콜백
│   ├── event_image_callback.py             # 이벤트 이미지 콜백
│   ├── menuboard_generate_callback.py      # 메뉴 포스터 콜백
│   ├── menuboard_ocr_service.py            # 메뉴보드 OCR 처리
│   └── receipt_ocr_callback.py             # 영수증 OCR 처리
├── models/                              # Pydantic 모델
│   ├── review_generate_models.py           # 리뷰 생성 요청/콜백/응답 모델
│   ├── event_image_models.py               # 이벤트 생성 메시지/콜백 모델
│   ├── menuboard_generate_models.py        # 메뉴 포스터 생성 메시지/콜백 모델
│   ├── menuboard_ocr_models.py             # 메뉴보드 OCR 요청/응답/콜백 모델
│   └── receipt_ocr_models.py               # 영수증 OCR 요청/콜백 모델
├── utils/
│   └── logger.py
├── env_example.txt                      # 환경변수 샘플
├── requirements.txt                     # 패키치 버전 관리 파일
└── main_backup.py                       # 과거 백업 (사용 안 함)
```

## Redis Streams → 생성 → 콜백 플로우
- 리뷰 생성: `review.asset.generate` → ReviewGenerateConsumer → 콜백 `/api/reviews/assets/callback`
- 이벤트 생성: `event.asset.generate` → EventImageConsumer → 콜백 `/api/events/assets/callback`
- 메뉴 포스터: `menu.poster.generate` → MenuboardGenerateConsumer → 콜백 `/api/menu-posters/assets/callback`
- 영수증 OCR: `ocr.verification.request` → ReceiptOCRConsumer → 콜백 `/api/reviews/ocr-verification/callback`

참고: `referenceImages`/`menu`는 XADD 시 JSON 문자열 단일 필드로 넣어야 하며, 소비자에서 자동 파싱합니다.

## 실행
```bash
cd AI
pip install -r requirements.txt
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

서버가 시작되면 4개 소비자가 백그라운드로 자동 구독됩니다.

## 주요 환경변수 (env_example.txt 참고)
- 공통: `REDIS_URL`, `REDIS_GROUP`, `REDIS_CONSUMER_ID`
- 스트림 키
  - `REVIEW_ASSET_STREAM_KEY=review.asset.generate`
  - `EVENT_ASSET_STREAM_KEY=event.asset.generate`
  - `MENU_POSTER_STREAM_KEY=menu.poster.generate`
  - `OCR_RECEIPT_STREAM_KEY=ocr.verification.request`
- 콜백 URL
  - `SPRING_CALLBACK_URL=/api/reviews/assets/callback`
  - `SPRING_EVENT_ASSET_CALLBACK_URL=/api/events/assets/callback`
  - `SPRING_MENU_POSTER_CALLBACK_URL=/api/menu-posters/assets/callback`
- 생성/외부 API 키
  - `GMS_API_KEY`, `GMS_BASE_URL`
  - `LUMAAI_API_KEY`, `RUNWAY_API_KEY`
  - `CLOVA_MENU_SECRET_KEY`, `CLOVA_MENU_API_URL`
  - `CLOVA_RECEIPT_SECRET_KEY`, `CLOVA_RECEIPT_API_URL`

## HTTP 엔드포인트(테스트/연동)
- 헬스: `GET /ai/health`
- 라우트 확인: `GET /ai/609`
- 메뉴판 OCR: `POST /ai/api/reviews/menu-extraction`
