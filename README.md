# EatDa - AI 기반 소상공인 홍보 플랫폼

<div align="center">

![EatDa](https://img.shields.io/badge/EatDa-Location--Based%20Platform-FF6B6B?style=for-the-badge)
![React Native](https://img.shields.io/badge/React_Native-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![Spring Boot](https://img.shields.io/badge/Spring_Boot-6DB33F?style=for-the-badge&logo=spring-boot&logoColor=white)
![FastAPI](https://img.shields.io/badge/FastAPI-009688?style=for-the-badge&logo=fastapi&logoColor=white)
![MySQL](https://img.shields.io/badge/MySQL-4479A1?style=for-the-badge&logo=mysql&logoColor=white)
![Redis](https://img.shields.io/badge/Redis-DC382D?style=for-the-badge&logo=redis&logoColor=white)

</div>

---

## 개발 기간 : 2025-07-14 ~ 2025-08-22

---

## 목차

- [프로젝트 소개](#프로젝트-소개)
- [기획 배경](#기획-배경)
- [핵심 목표](#핵심-목표)
- [기술 스택](#기술-스택)
- [시스템 아키텍처](#시스템-아키텍처)
- [서비스 화면](#서비스-화면)
- [핵심 기능](#핵심-기능)
- [트러블슈팅](#트러블슈팅)
- [ERD](#erd)
- [팀원 소개](#팀원-소개)
---

## 프로젝트 소개

**EatDa**는 디지털 마케팅에 어려움을 겪는 **고령 소상공인과 자영업자**를 위한 **AI 기반 위치 기반 로컬 커뮤니티 서비스**입니다.

### 🌟 핵심 가치

#### 🏪 소상공인을 위한 가치
- **AI 자동 홍보물 생성**: 리뷰 기반 숏폼 영상, 메뉴 포스터, 이벤트 배너를 AI가 자동으로 생성
- **마케팅 비용 절감**: 높은 홍보 비용과 전문 인력 부담 해결
- **간편한 관리**: 복잡한 디지털 마케팅 도구 없이 쉽게 가게 홍보

#### 👥 소비자를 위한 가치
- **위치 기반 탐색**: 내 주변 가게의 실제 음식 사진과 생생한 리뷰를 SNS 피드처럼 탐색
- **통합된 정보**: 여러 플랫폼에 흩어진 리뷰와 이벤트 정보를 한눈에
- **숨은 맛집 발견**: 마케팅 부족으로 알려지지 않은 진짜 맛집 발굴

#### 🤝 커뮤니티 가치
- **참여형 콘텐츠**: 메뉴판 프레임 제작 경쟁, 리워드 제공
- **지역 상권 활성화**: 사용자 참여를 통한 지역 경제 기여

### 🎨 차별점

| 항목 | 기존 플랫폼 | EatDa |
|------|-----------|-------|
| **콘텐츠 구조** | 리스트·별점 중심 | 이미지 + 숏폼 중심 SNS 피드 |
| **리뷰 탐색** | 별점 + 텍스트 | 위치 기반 주변 리뷰 통합 탐색 |
| **홍보 지원** | 사장님 직접 제작 | AI 자동 생성 (숏폼/포스터/배너) |
| **위치 탐색** | 주소 검색 중심 | H3 기반 거리순 실시간 탐색 |
| **이벤트 정보** | 가게별 페이지만 노출 | 내 주변 이벤트 한눈에 모아보기 |
| **유저 참여** | 리뷰·댓글 작성 | 메뉴판 제작 경쟁 + 리워드 |

---

## 기획 배경

### 🔴 Problem 1: 소상공인의 디지털 마케팅 어려움

<img src="https://i.imgur.com/xNqZexN.png" width="40%">

- **고령 자영업자 증가**: 디지털 활용 격차 심화
- **마케팅 실패로 인한 폐업**: 개인 대응 가능 영역에서 마케팅 실패가 최대 비중

<img src="https://i.imgur.com/G6nJkVe.png" width="60%">

- **높은 홍보 비용**: 광고, 콘텐츠 제작, 웹사이트 관리 비용 부담
- **전문 인력 확보 어려움**: 디자이너/마케터 고용 비용 부담

### 🔴 Problem 2: 소비자의 맛집 탐색 불편함

- **음식 사진과 리뷰를 한눈에 보기 어려움**: 단순 주소/별점 리스트가 아닌 직관적 선택 필요
- **위치 기반 탐색 미흡**: 내 위치 주변 매장 탐색 기능 부족
- **리뷰 정보 분산**: 여러 플랫폼에 흩어진 텍스트 중심 리뷰
- **이벤트 정보 접근 어려움**: 포털, SNS, 배달앱 등에 분산된 할인 정보
- **숨은 맛집 아쉬움**: 홍보 부족으로 외면받는 좋은 가게들

---

## 핵심 목표

> **위치 기반 로컬 커뮤니티 서비스**

소비자는 **내 주변 가게의 이벤트와 실사용 리뷰를 SNS 피드처럼 쉽게 탐색**하고,  
사장님은 **AI를 활용해 본인의 사업장을 홍보할 여러 방안을 간편하게 제작·관리**할 수 있는 플랫폼

✅ **인스타그램**의 이미지 피드  
✅ **배민**의 리뷰 시스템  
✅ **당근마켓**의 내 주변 위치 기반 탐색

→ **위치 기반 + 커뮤니티 중심 + AI 홍보 자동화** 실현

---

## 기술 스택

### Frontend
![React Native](https://img.shields.io/badge/React_Native-20232A?style=flat-square&logo=react&logoColor=61DAFB)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=flat-square&logo=typescript&logoColor=white)

**React Native + TypeScript**
- 대규모 커뮤니티 생태계 기반 안정성
- 네이티브 컴포넌트 접근으로 성능 최적화
- 정적 타입 시스템으로 런타임 오류 사전 방지

### Backend
![Spring Boot](https://img.shields.io/badge/Spring_Boot_3.5.7-6DB33F?style=flat-square&logo=spring-boot&logoColor=white)
![Java](https://img.shields.io/badge/Java_21-007396?style=flat-square&logo=java&logoColor=white)
![FastAPI](https://img.shields.io/badge/FastAPI-009688?style=flat-square&logo=fastapi&logoColor=white)
![Python](https://img.shields.io/badge/Python-3776AB?style=flat-square&logo=python&logoColor=white)

**Spring Boot (정형 API)** + **FastAPI (AI 서비스)**
- Spring Boot: 서비스 중심 정형 API, 엔터프라이즈 패턴
- FastAPI: 비동기 I/O 기반 AI 모델 연동 전용

### Database
![MySQL](https://img.shields.io/badge/MySQL_8.x-4479A1?style=flat-square&logo=mysql&logoColor=white)
![Redis](https://img.shields.io/badge/Redis-DC382D?style=flat-square&logo=redis&logoColor=white)

**MySQL (메인)** + **Redis (보조)**
- MySQL: 관계형 데이터, ACID 트랜잭션
- Redis: 세션/캐시/Redis Streams (메시징 큐)

### AI
![OpenAI](https://img.shields.io/badge/GPT--4o-412991?style=flat-square&logo=openai&logoColor=white)
![Stable Diffusion](https://img.shields.io/badge/SD3_LoRA-FF6F00?style=flat-square)

- **Luma AI & RunwayML Gen-4**: 숏폼 비디오 생성
- **GPT-4o**: 프롬프트 엔지니어링
- **NAVER CLOVA OCR**: 영수증 인증
- **Stable Diffusion 3**: 이미지 생성 (LoRA Fine-tuning)

### Infrastructure
![AWS](https://img.shields.io/badge/AWS_EC2-232F3E?style=flat-square&logo=amazon-aws&logoColor=white)
![Docker](https://img.shields.io/badge/Docker-2496ED?style=flat-square&logo=docker&logoColor=white)
![Nginx](https://img.shields.io/badge/Nginx-009639?style=flat-square&logo=nginx&logoColor=white)
![Prometheus](https://img.shields.io/badge/Prometheus-E6522C?style=flat-square&logo=prometheus&logoColor=white)
![Grafana](https://img.shields.io/badge/Grafana-F46800?style=flat-square&logo=grafana&logoColor=white)

- **AWS EC2 (xlarge)**: 단일 서버 (4vCPU / 16GB RAM)
- **Docker + Nginx**: 컨테이너 분리, Reverse Proxy
- **Prometheus + Grafana**: 메트릭 수집 및 시각화

### 제약 사항

⚠️ **단일 EC2 서버 환경**
- 모든 서비스를 1대 인스턴스에 설치
- 고가용성/오토스케일링 불가
- 모놀리식/모듈러 모놀리식 구조 채택
- Docker 기반 경량화 설계 필수

---

## 시스템 아키텍처

<img src="https://i.imgur.com/twJ0i4L.png" width="80%">

### 전체 구조
┌─────────────┐
│ React Native│
│ Client │
└──────┬──────┘
│
▼
┌─────────────────────────────────────┐
│ Nginx (Reverse Proxy) │
└──────┬──────────────────────┬───────┘
│ │
▼ ▼
┌─────────────┐ ┌──────────────┐
│ Spring │◄─────┤ FastAPI │
│ Boot │ │ (AI Service)│
└──────┬──────┘ └──────────────┘
│
├──────────────┐
▼ ▼
┌─────────┐ ┌────────────┐
│ MySQL │ │ Redis │
└─────────┘ │ Streams │
│ + Cache │
└────────────┘

### Blue-Green Deployment

<img src="https://i.imgur.com/4GXNlA0.png" width="60%">

무중단 배포를 위한 Blue-Green 전략 적용

### Redis Cache 전략

<img src="https://i.imgur.com/sRzly1P.png" width="60%">

#### 멀티 레벨 캐시 구조

**L1 캐시 (Caffeine)**
- JVM 힙 메모리 내부
- 핫스팟 데이터만 저장 (최대 100개)
- TTL: 60분
- 초고속 응답 (1ms)

**L2 캐시 (Redis)**
- 외부 공유 캐시
- 전체 데이터 저장
- 분산 환경 캐시 일관성 유지

#### 조회 흐름
사용자 요청 → L1 확인 → L2 확인 → MySQL 조회
↓ Hit ↓ Hit ↓
응답 L1 승격 캐시 갱신

### Redis Streams 메시징

<img src="https://i.imgur.com/p2QYqIW.png" width="60%">

#### 비동기 처리 파이프라인

**적용 대상**
- `review.asset.generate`: 리뷰 숏폼/이미지 생성
- `menu.poster.generate`: 메뉴 포스터 생성
- `event.asset.generate`: 이벤트 배너 생성

**특징**
- Consumer Group 기반 메시지 소비
- 실패 시 최대 3회 재시도
- DLQ(Dead Letter Queue) 처리
- TTL 기반 메시지 만료 (리뷰: 5분)
- Spring Batch로 20분마다 만료 메시지 정리

---

## 서비스 화면

### 로그인/회원가입
<p>
  <img src="https://github.com/user-attachments/assets/99278b2e-bdd6-4335-aa34-1fa32d264bde" height="300"/>
  <img src="https://github.com/user-attachments/assets/d3b6edee-46ee-4ba1-8d7b-b88141660f5e" height="300"/>
</p>
<p>
  <img src="https://github.com/user-attachments/assets/d4e61547-1640-4f0a-a0b8-e9014838db97" height="300"/>
  <img src="https://github.com/user-attachments/assets/5b6537d1-2941-415f-a006-30bc6c92f9b4" height="300"/>
  <img src="https://github.com/user-attachments/assets/9333d009-81f2-44f7-ac26-6e8e0c5b4fc3" height="300"/>
  <img src="https://github.com/user-attachments/assets/621ec511-a224-4512-a81b-165454746711" height="300"/>
  <img src="https://github.com/user-attachments/assets/ddbd3f39-ab2c-444a-be70-42737bd42f46" height="300"/>
  <img src="https://github.com/user-attachments/assets/d7c64a2d-4e1d-411a-b52b-07155ab116cc" height="300"/>
</p>

### 리뷰 피드
<p>
    <img src="https://github.com/user-attachments/assets/9b702f77-d5ef-4a14-92e4-2ceb79445111" height="300"/>
    <img src="https://github.com/user-attachments/assets/9caa7799-cbbe-49f3-97bf-ac1d48d53164" height="300"/>
</p>

### 가게 메뉴, 이벤트
<p>
    <img src="https://github.com/user-attachments/assets/9061bbd5-292a-403e-82a7-6e3e548150ab" height="300"/>
    <img src="https://github.com/user-attachments/assets/386bd5dd-993d-4249-bf5e-1b5a4a398371" height="300"/>
    <img src="https://github.com/user-attachments/assets/fbdd5bfd-6bf6-41d4-9dd5-93fe33f1f260" height="300"/>
    <img src="https://github.com/user-attachments/assets/ecdff839-a98d-4703-bfd7-9f37c2a47589" height="300"/>
    <img src="https://github.com/user-attachments/assets/18ba07a0-eb18-4c0b-911a-13450b816f44" height="300"/>
</p>

### 리뷰 작성
<p>
    <img src="https://github.com/user-attachments/assets/435d88c0-b034-425c-b2e2-eb0b3ccfd567" height="300"/>
    <img src="https://github.com/user-attachments/assets/857e2380-b306-422a-87fa-2f5878ce191b" height="300"/>
    <img src="https://github.com/user-attachments/assets/2d19ae4d-5f99-4574-be00-1420bd370de3" height="300"/>
    <img src="https://github.com/user-attachments/assets/867a3f46-3462-45bf-a473-9d673a3fa818" height="300"/>
    <img src="https://github.com/user-attachments/assets/b5274859-88d8-4885-a19b-8d49cedb7954" height="300"/>
    <img src="https://github.com/user-attachments/assets/c0994442-7b1e-45eb-8b16-7b43aef0b0ca" height="300"/>
</p>

### 메뉴판 꾸미기
<p>
    <img src="https://github.com/user-attachments/assets/f1b307b3-3779-4f73-8cc3-f0aec6f33421" height="300"/>
    <img src="https://github.com/user-attachments/assets/7f101b70-f2c7-464f-9de7-25bd81874bc7" height="300"/>
    <img src="https://github.com/user-attachments/assets/693af2e9-8b6a-4add-b1a8-336091ee7a6a" height="300"/>
    <img src="https://github.com/user-attachments/assets/c5bc2200-7513-477f-964b-4c2aeb6f49b8" height="300"/>
</p>

### 이벤트 만들기
<p>
    <img src="https://github.com/user-attachments/assets/991e3f27-8751-4f4b-ba1c-2726046526f4" height="300"/>
    <img src="https://github.com/user-attachments/assets/ea8d4e75-3e3c-45ff-9f14-c3fdac1322ff" height="300"/>
    <img src="https://github.com/user-attachments/assets/ce2169af-7a77-46f1-901e-1d63a1a8bddb" height="300"/>
    <img src="https://github.com/user-attachments/assets/a909366d-e9a6-41f2-8bb3-9e3206335fdc" height="300"/>
</p>

### 마이페이지
<p>
    <img src="https://github.com/user-attachments/assets/12671e73-e781-49b2-91b4-f26db173da63" height="300"/>
    <img src="https://github.com/user-attachments/assets/fd7f01f6-ebcf-4bca-9cef-396b9adcc89b" height="300"/>
    <img src="https://github.com/user-attachments/assets/b329f9da-faf8-40d0-98e9-fa1654082538" height="300"/>
    <img src="https://github.com/user-attachments/assets/7ca09544-2223-4e51-8133-20938725f113" height="300"/>
</p>

---


## 핵심 기능

### 1️⃣ 위치 기반 피드 조회

<details>
<summary><b>H3 공간 인덱싱 + 멀티 레벨 캐싱</b></summary>

#### H3 공간 인덱싱

<img src="https://i.imgur.com/kRiV6u0.png" width="50%">

- **육각형 셀 구조**: 삼각형/사각형보다 균일한 거리 계산
- **거리별 해상도 설정**: 300m, 500m, 700m, 1km, 2km
- **효율적인 필터링**: 1차 H3 필터 → 2차 정밀 거리 계산

<img src="https://i.imgur.com/IRGBF7i.png" width="20%">

#### 조회 흐름

1. **L1 캐시 확인**
   <img src="https://i.imgur.com/zfZ8YbS.png" width="60%">
   
2. **L2 캐시 확인**
   <img src="https://i.imgur.com/6B1ypE1.png" width="60%">
   
3. **핫스팟 승격**
   <img src="https://i.imgur.com/3jUy22R.png" width="60%">

#### 캐시 미스 처리

4. **MySQL 조회 + H3 필터링**
   <img src="https://i.imgur.com/bFJj9uj.png" width="60%">
   
5. **Redis 업데이트**
   <img src="https://i.imgur.com/gkh8yHu.png" width="60%">

#### 핫스팟 관리
- 1시간 동안 임계값 이상 조회 → 핫스팟 지정
- 핫스팟 데이터 → L1 캐시 승격
- CPU/메모리 사용률 기반 동적 임계값 조정

</details>

### 2️⃣ AI 콘텐츠 자동 생성

<details>
<summary><b>리뷰 기반 숏폼/이미지 생성</b></summary>

#### 생성 흐름

1. **생성 요청** (React Native → Spring Boot)
   <img src="https://i.imgur.com/NY5y1jC.png" width="60%">

2. **Redis Streams 발행** (Spring Boot → Redis)
   <img src="https://i.imgur.com/LhkcKmd.png" width="60%">

3. **AI 생성** (FastAPI Consumer)
   - GPT-4o로 프롬프트 엔지니어링
   - Luma AI / Gen-4로 숏폼 생성
   - 최대 3회 재시도, 실패 시 DLQ 이동

4. **콜백** (FastAPI → Spring Boot)
   <img src="https://i.imgur.com/rsB0bfm.png" width="60%">

5. **결과 조회** (Polling)
   <img src="https://i.imgur.com/fGJZW8p.png" width="60%">

6. **리뷰 등록**
   <img src="https://i.imgur.com/m5fgiZq.png" width="60%">

7. **실패 객체 정리**
   <img src="https://i.imgur.com/7cYkVl4.png" width="60%">

</details>

<details>
<summary><b>메뉴 포스터 생성</b></summary>

#### SD3 LoRA Fine-tuning
- 한국어 텍스트 렌더링 특화 학습
- rank=8, alpha=16, lora_dropout=0.05
- 텍스트 인코더 동결 + VRAM 최적화

#### 커뮤니티 참여
- 사용자가 메뉴판 프레임 제작
- 다른 사용자 투표
- 가게 사장님 채택 시 제작자 리워드

</details>

<details>
<summary><b>이벤트 배너 생성</b></summary>

- 이벤트 정보 입력 (제목/기간/할인율)
- AI 자동 배너 이미지 생성
- Redis Streams 비동기 처리

</details>

### 3️⃣ OCR 영수증 인증

**NAVER CLOVA OCR**
- 한글 인식 최고 수준 (한국어 특화)
- 영수증 주소/날짜 정보 추출
- 실제 방문 검증 → 리뷰 작성 권한 부여

---

## 트러블슈팅

### Backend

<details>
<summary><b>1. 캐시 무효화 전략 최적화</b></summary>

#### 문제 상황
- 사전 계산된 거리 정보 캐싱
- 가게 등록 시 신규 가게가 캐시에 반영 안 됨
- 실시간 거리 계산은 O(n) 복잡도로 지연

#### 해결 전략

**1) H3 공간 인덱싱**
- 거리별 해상도 설정 → 1차 필터링
- 육각형 셀: 균일한 거리, 적은 인접 셀

**2) 핫스팟 + 캐시 상태**
- Fresh: DB 일치 캐시
- Stale: 비동기 갱신 필요
- 핫스팟 + Stale → 비동기 갱신 + 즉시 응답

**3) 계층적 캐시**
- L1 (Caffeine): 핫스팟만, 60분 TTL
- L2 (Redis): 전체 데이터

**4) 동적 임계값 조정**
- CPU 80%↑ → 핫스팟 범위 확대 (50회/1h)
- CPU 30%↓ → 핫스팟 범위 축소 (200회/1h)
- 메모리 85%↑ → TTL 감소 (최소 5분)
- Cache hit 70%↓ → TTL 증가 (최대 60분)

</details>

<details>
<summary><b>2. Redis Streams 도입</b></summary>

#### 문제 상황

<img src="https://i.imgur.com/aF3zlzm.png" width="60%">

- AI 생성 처리 시간 길어 비동기 필수
- 직접 비동기: 요청 손실, 과부하, 장애 전파 위험

#### 해결: 메시지 큐

<img src="https://i.imgur.com/ksFkwv3.png" width="60%">

- Producer/Consumer 분리
- 재시도, 백프레셔, 느슨한 결합

#### 왜 Redis Streams?

<img src="https://i.imgur.com/1Ma1BcW.png" width="60%">

- RabbitMQ: 단일 EC2라 브로커 부담
- Redis Queue: 재처리/순서/DLQ 없음
- **Redis Streams**: 재처리·순서·DLQ 표준 지원

#### 구성

<img src="https://i.imgur.com/p2QYqIW.png" width="60%">

- 3가지 스트림: 리뷰/메뉴포스터/이벤트
- Consumer Group 소비
- 실패 시 최대 3회 재시도 → DLQ
- MAXLEN 2000개 제한
- TTL 기반 만료 (리뷰: 5분)
- Spring Batch 20분마다 정리

</details>

### AI

<details>
<summary><b>3. SD3 Fine-tuning 최적화</b></summary>

#### 목적
한국어 텍스트 렌더링 특화 LoRA 파인튜닝

#### 문제와 해결

**1) 데이터 로더 병목 & RAM 폭증**
- 원인: 전체 경로 리스트업, random.sample(50000)
- 해결: Manifest 스트리밍, IterableDataset

**2) 체크포인트 불일치 → NaN/품질 저하**
- 원인: LoRA rank/alpha 과도
- 해결: rank=8, alpha=16, lora_dropout=0.05

**3) VRAM 한계**
- 텍스트 인코더 동결 → VRAM 절감
- LoRA 필요 시점만 attach
- 임베딩 CPU 계산 → GPU는 U-Net 집중

</details>

<details>
<summary><b>4. 프롬프트 엔지니어링 5단계 진화</b></summary>

#### 1차: 가이드라인 제공
❌ 일관성 부족, 할루시네이션

#### 2차: Few-shot 학습
✅ 품질 향상  
❌ 과적합, 동일 답변 반복

#### 3차: 루브릭 점수
- 5가지 항목 체크 (주제/행동/장면/스타일/카메라)
- 최대 3회 재생성
❌ 주관적 지표, 품질 개선 미흡

#### 4차: LLM Self-refine
- Checklist + LLM 점수 평균
- 부분/전체 재생성 분기
❌ 시간 소요 증가

#### 5차: 데이터화
- 고득점 프롬프트 전/후 기록
✅ 향후 SFT 미세튜닝용 데이터 확보
✅ 생성 시간 단축 가능성

</details>

---

## 💾 ERD

<img src="https://i.imgur.com/zJspPYs.png" width="70%">

<details>
<summary><b>주요 테이블 구조</b></summary>

```sql
-- 사용자
CREATE TABLE user (
  id BIGINT PRIMARY KEY,
  email VARCHAR(255) UNIQUE,
  nick_name VARCHAR(50) UNIQUE,
  role VARCHAR(20) COMMENT 'EATER or MAKER',
  provider VARCHAR(20) COMMENT 'GOOGLE, KAKAO'
);

-- 가게
CREATE TABLE store (
  id BIGINT PRIMARY KEY,
  name VARCHAR(100),
  address VARCHAR(255),
  latitude DOUBLE,
  longitude DOUBLE,
  h3_index7 BIGINT,
  h3_index8 BIGINT,
  h3_index9 BIGINT,
  h3_index10 BIGINT,
  maker_id BIGINT,
  FOREIGN KEY (maker_id) REFERENCES user(id)
);

-- 리뷰
CREATE TABLE review (
  id BIGINT PRIMARY KEY,
  user_id BIGINT,
  store_id BIGINT,
  description TEXT,
  status ENUM('PENDING', 'SUCCESS', 'FAIL'),
  FOREIGN KEY (user_id) REFERENCES user(id),
  FOREIGN KEY (store_id) REFERENCES store(id)
);

-- AI 생성 자산
CREATE TABLE review_asset (
  id BIGINT PRIMARY KEY,
  review_id BIGINT UNIQUE,
  type VARCHAR(20) COMMENT 'SHORTS or IMAGE',
  image_url TEXT,
  shorts_url TEXT,
  prompt TEXT,
  status ENUM('PENDING', 'SUCCESS', 'FAIL'),
  FOREIGN KEY (review_id) REFERENCES review(id)
);
```
</details>

팀원 소개
<div align="center">
| 역할 | 이름 | GitHub |
|:---:|:---:|:---:|
| 팀장 / Infra | 백제완 | @jewan100 |
| BE | 김건학 | @Gonagi |
| BE | 한종욱 | @Ukj0ng |
| FE | 양세희 | @sehee-xx |
| FE | 이종현 | @Maoka2 |
| AI | 최상인 | @sangin302 |
</div>


라이선스
이 프로젝트는 MIT 라이선스 하에 배포됩니다.
<div align="center">
 EatDa - AI로 소상공인과 소비자를 연결하는 위치 기반 로컬 커뮤니티 플랫폼 GitHub </div>
```
