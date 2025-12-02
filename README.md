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
