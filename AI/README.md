# AI FastAPI 서버 실행 가이드

## 폴더 구조 (리팩토링 완료)

```
AI/
├── main.py                  👈 FastAPI 앱 실행 진입점
├── routers/
│   └── generate.py          👈 엔드포인트 분리
├── services/
│   ├── luma_service.py      👈 Luma AI 연동 함수
│   ├── gpt_service.py       👈 GPT 프롬프트 생성 함수
│   └── callback_service.py  👈 스프링 콜백 함수
├── models/
│   └── shorts_models.py    👈 Pydantic 요청/응답 모델들
├── utils/
│   └── logger.py            👈 로깅 유틸 함수들
├── .env
├── requirements.txt
├── main_backup.py           👈 기존 main.py 백업
└── 기존 API 폴더들 (유지됨)
    ├── gms_api/             👈 GPT 프롬프트 생성 (현재 서비스에서 사용)
    ├── luma_api/            👈 Luma AI 관련
    ├── ocr_api/             👈 OCR 관련
    ├── runway_api/          👈 Runway AI 관련
    └── venv/                👈 Python 가상환경
```

### 🔄 리팩토링 내용
- **main.py**: FastAPI 앱 초기화와 라우터 등록만 담당
- **라우터 분리**: 엔드포인트별로 별도 파일로 분리
- **서비스 계층**: 비즈니스 로직을 서비스 클래스로 분리
- **모델 분리**: Pydantic 모델들을 별도 파일로 정리
- **유틸리티**: 공통 기능들을 utils 폴더로 분리

## 사전 준비사항

### 1. 환경변수 설정
`env_example.txt` 파일을 참고하여 `.env` 파일을 생성하고 다음 값들을 설정하세요:

```bash
# .env 파일에 다음 내용 추가
LUMAAI_API_KEY=여기에_실제_Luma_AI_키_입력
OPENAI_API_KEY=여기에_실제_OpenAI_키_입력
SPRING_CALLBACK_URL=https://i13a609.p.ssafy.io/api/reviews/assets/callback
```

### 2. Python 패키지 설치
```bash
# AI 디렉토리로 이동
cd AI

# 가상환경 생성 
python -m venv venv

# 가상환경 활성화
# Windows:
venv\Scripts\activate
# Mac/Linux:
source venv/bin/activate

# 패키지 설치
pip install -r requirements.txt
```

## 🏃‍♂️ 서버 실행

### 방법 1: 개발 모드 (자동 리로드)
```bash
cd AI
python main.py
```

### 방법 2: Uvicorn 직접 실행
```bash
cd AI
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

## 📡 API 엔드포인트

서버가 실행되면 다음 URL에서 접근 가능합니다:
- **API 문서**: https://www.notion.so/API-23abb13c7ad58099b420f9c4296c6bb7?source=copy_link (notion)
- **상태 확인**: http://localhost:8000/health
- **루트 확인**: http://localhost:8000/609
- **영상 생성**: POST http://localhost:8000/api/reviews/assests/generate

### 영상 생성 API 사용 예시

```bash
# curl을 사용한 예시
curl -X POST "http://localhost:8000/api/reviews/assests/generate" \
     -H "Content-Type: application/json" \
     -d '{
       "reviewAssetId": 1,
       "type": "SHORTS",
       "prompt": "맛있는 음식을 먹는 모습",
       "storeId": 1,
       "userId": 1,
       "requestedAt": "2025-01-01T00:00:00Z",
       "expireAt": "2025-01-01T01:00:00Z",
       "retryCount": 0,
       "menu": [
         {
           "id": 1,
           "name": "치킨",
           "description": "바삭한 치킨",
           "imageUrl": "https://example.com/chicken.jpg"
         }
       ],
       "referenceImages": ["https://example.com/image1.jpg"]
     }'
```

또는 Python requests:
```python
import requests

response = requests.post(
    "http://localhost:8000/api/reviews/assests/generate",
    json={
        "reviewAssetId": 1,
        "type": "SHORTS",
        "prompt": "맛있는 음식을 먹는 모습",
        "storeId": 1,
        "userId": 1,
        "requestedAt": "2025-01-01T00:00:00Z",
        "expireAt": "2025-01-01T01:00:00Z",
        "retryCount": 0,
        "menu": [
            {
                "id": 1,
                "name": "치킨",
                "description": "바삭한 치킨",
                "imageUrl": "https://example.com/chicken.jpg"
            }
        ],
        "referenceImages": ["https://example.com/image1.jpg"]
    }
)
print(response.json())
```

## 🔧 문제 해결

### 1. 환경변수 오류
- `.env` 파일이 `AI` 디렉토리에 있는지 확인
- API 키가 올바르게 입력되었는지 확인

### 2. 패키지 오류
```bash
pip install --upgrade pip
pip install -r requirements.txt --force-reinstall
```

### 3. 포트 충돌
```bash
# 다른 포트로 실행
uvicorn main:app --host 0.0.0.0 --port 8081
```

## 📁 생성된 파일

영상 생성이 완료되면:
- `downloads/` 폴더에 `.mp4` 파일이 저장됩니다
- API 응답에 온라인 URL도 포함됩니다

## ⚠️ 주의사항

1. **CORS 설정**: 운영환경에서는 `ALLOWED_ORIGINS`를 특정 도메인으로 제한하세요
2. **영상 생성 시간**: Luma AI 영상 생성은 2-4분 정도 소요됩니다(9초 영상 기준)


### python version
$ python --version
Python 3.11.9
(venv) 

### 메뉴판 인식 샘플

RN 플로우 엔드포인트(백그라운드 처리)
Method: POST
URL: https://i13a609.p.ssafy.io/ai/api/reviews/menu-extraction
Body: raw(JSON)

{
"sourceId": 123,
"storeId": 456,
"userId": 789,
"imageUrl": "https://example.com/menu.png",
"type": "MENU",
"requestedAt": "2025-01-27T10:00:00Z",
"expireAt": "2025-01-27T11:00:00Z",
"retryCount": 0
}