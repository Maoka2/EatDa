# AI FastAPI 서버 실행 가이드

## 사전 준비사항

### 1. 환경변수 설정
`env.example` 파일을 참고하여 `.env` 파일을 생성하고 다음 값들을 설정하세요:

```bash
# .env 파일에 다음 내용 추가
LUMAAI_API_KEY=여기에_실제_Luma_AI_키_입력
GMS_API_KEY=여기에_실제_GMS_키_입력
추가 API_KEY는 버전 관리하면서 추가 될 예정
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
- **영상 생성**: POST http://localhost:8000/generate-video

### 영상 생성 API 사용 예시

```bash
# curl을 사용한 예시
curl -X POST "http://localhost:8000/generate-video" \
     -H "Content-Type: application/json" \
     -d '{"prompt": "고양이가 공원에서 뛰어노는 모습"}'
```

또는 Python requests:
```python
import requests

response = requests.post(
    "http://localhost:8000/generate-video",
    json={
        "prompt": "고양이가 공원에서 뛰어노는 모습"
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
uvicorn main:app --host 0.0.0.0 --port 8001
```

## 📁 생성된 파일

영상 생성이 완료되면:
- `downloads/` 폴더에 `.mp4` 파일이 저장됩니다
- API 응답에 온라인 URL도 포함됩니다

## ⚠️ 주의사항

1. **CORS 설정**: 운영환경에서는 `ALLOWED_ORIGINS`를 특정 도메인으로 제한하세요
2. **영상 생성 시간**: Luma AI 영상 생성은 2-4분 정도 소요됩니다(9초 영상 기준)