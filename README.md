<h1>S13P11A609</h1>

# 1. 개요

<details><summary style="font-size: 1.5em; font-weight: bold; margin: 0.83em 0;">1.1. 기획 의도</summary>

### 📌 홍보 부담에 시달리는 오프라인 소상공인과 자영업자

오프라인 중심의 소상공인, 특히 중장년층 이상의 자영업자들은 디지털 마케팅에 어려움을 겪고 있습니다. 다음과 같은 문제들이 반복되고 있습니다:

- **고령 자영업자의 증가**: 고령층 창업이 증가하면서 디지털 활용에 대한 격차가 더욱 뚜렷해지고 있음

  <img src="https://i.imgur.com/xNqZexN.png" width="40%">


- **마케팅 실패로 인한 폐업**: 폐업 원인 중 개인이 대응 가능한 영역에서는 마케팅 실패가 가장 높은 비중을 차지

  <img src="https://i.imgur.com/G6nJkVe.png" width="60%">


- **높은 홍보 비용과 유지보수 부담**: 광고, 콘텐츠 제작, 웹사이트 관리 등에 드는 비용이 크고 지속적인 유지가 어려움
- **전문 인력 확보의 어려움**: 디자이너나 마케팅 전문가를 고용하기엔 인력과 비용 모두 부담

---

### 🔍 Problem: 소비자가 겪는 지역 맛집 탐색의 불편함

소비자 입장에서도 지역 내 외식 장소를 선택하는 과정에서 여러 불편함이 존재합니다:

- **음식 사진과 실제 리뷰를 한눈에 보기 어려움**

  단순한 주소나 별점 리스트가 아닌, **실제 음식 사진과 생생한 리뷰**를 통해 직관적으로 선택하고 싶지만, 이를 잘 지원하는 플랫폼이 부족합니다.

- **위치 기반 탐색의 불편함**

  내 위치 주변의 매장을 쉽게 탐색하는 기능이 미흡하거나 접근성이 떨어집니다.

- **리뷰 정보의 분산과 낮은 품질**

  리뷰가 여러 플랫폼에 흩어져 있어 찾아보기 어렵고, 대부분 텍스트 위주의 반복적인 내용으로 실질적인 도움을 주지 못합니다.

- **이벤트·할인 정보 접근 어려움**

  할인이나 이벤트 정보가 포털, SNS, 배달앱 등에 분산돼 있어 한눈에 확인하기 어렵습니다.

- **알려지지 않은 맛집에 대한 아쉬움**

  “**이 집 정말 맛있는데 마케팅을 못해서 나만 알고 있는 게 아쉽다**” → 맛은 훌륭하지만 홍보 부족으로 외면받는 가게들이 많습니다.
</details>

<details><summary style="font-size: 1.5em; font-weight: bold; margin: 0.83em 0;">1.2. 핵심 목표</summary>

> 위치 기반 로컬 커뮤니티 서비스
>

소비자는 **내 주변 가게의 이벤트와 실사용 리뷰를 SNS 피드처럼 쉽게 탐색**하고,

사장님은 **AI를 활용해 본인의 사업장을 홍보할 여러 방안을 간편하게 제작·관리**할 수 있는 플랫폼.

✅ 인스타그램의 이미지 피드

✅ 배민의 리뷰 시스템

✅ 당근마켓의 내 주변 위치 기반 탐색

이 기능들을 결합해 **위치 기반 + 커뮤니티 중심 + AI 홍보 자동화**를 실현합니다.
</details>

<details><summary style="font-size: 1.5em; font-weight: bold; margin: 0.83em 0;">1.3. 차별점</summary>

기존 플랫폼들이 제공하지 못한 사용자 경험과 자동화를 통해, 소비자와 자영업자 모두에게 **더 직관적이고 효율적인 솔루션**을 제공합니다.

| 항목 | 기존 플랫폼 | 본 서비스 |
| --- | --- | --- |
| **콘텐츠 구조** | 리스트·별점 중심 | 이미지 + 숏폼 중심의 SNS 피드 |
| **리뷰 탐색 방식** | 별점 + 텍스트 기반 | 내 위치 기반 주변 리뷰 통합 탐색 |
| **홍보 지원** | 사장님이 직접 콘텐츠 제작 부담 | AI가 자동으로 홍보 이미지·쇼츠 생성 |
| **위치 탐색** | 주소 검색 중심 | 사용자 위치 기반 거리순 탐색 |
| **이벤트 정보** | 가게별 페이지에만 노출 | 내 주변 이벤트·할인 정보를 한눈에 모아보기 |
| **유저 참여 유도** | 리뷰·댓글 작성 중심 | 메뉴판 프레임 제작 경쟁, 리워드 제공 등 참여형 콘텐츠 |

</details>

---

# 2. 기술 스택

| 기능 | 기술 스택 |
| --- | --- |
| API 서버 | Spring Boot, FastAPI |
| 프론트엔드 | React Native, TypeScript |
| DB | MySQL (메인), Redis (보조) |
| 비정형 데이터 | EC2에 저장 |
| 메시징 큐 | Redis Streams |
| 모니터링 | Prometheus + Grafana |
| 배포/CI | Docker, Nginx, Gitlab Runner |
| 서버 | EC2 (1대, xlarge) |
| AI | Luma ai, Gen-4, Gpt-4o, NAVER CLOVA, Google Gemini제약 사항 |

## 제약 사항

- **서버는 1대만 제공**되며, 모든 서비스 구성 요소(프론트엔드, 백엔드, DB, AI 등)를 해당 인스턴스에 설치해야 함
- **고정 리소스** 환경이므로, 고가용성/오토스케일링/분산처리는 불가능
- 도커 기반의 **컨테이너 분리** 및 **경량화 설계**가 필요

> 단일 EC2 서버 환경이라는 제약으로 인해, 전체 시스템은 MSA가 아닌 모놀리식 또는 모듈러 모놀리식 구조로 구성되어야 하며, Queue, Redis, Database 등도 단일 노드 기반으로 운영해야 함
>

<details><summary style="font-size: 1.5em; font-weight: bold; margin: 0.83em 0;">2.1. FE</summary>

> 다양한 프론트엔드 프레임워크와 스타일링 도구 중, 본 프로젝트는 React Native를 사용자 인터페이스 렌더링에, TypeScript를 정적 타입 기반 개발에 각각 활용하기 위해 조합하여 선택했습니다.
>

### React Native

- **대규모 커뮤니티와 생태계** 기반의 프레임워크로, 안정성과 자료 접근성이 뛰어남
- **풍부한 오픈소스 라이브러리**(예: React Navigation, Reanimated, Gesture Handler 등)빠른 개발 지원
- **네이티브 컴포넌트 접근**을 통해 성능 저하를 최소화하고, 필요 시 커스텀 네이티브 모듈 삽입 가능
- **SPA 구조**를 모바일 앱에도 적용하여 화면 전환과 상태 관리가 일관적이고 예측 가능

### TypeScript

- **정적 타입 시스템**으로 런타임 오류를 사전에 방지
- 컴포넌트 간 계약(contract)을 명확히 정의
- React Native의 컴포넌트 props, 네비게이션 파라미터 등에 타입을 적용해 **안전한 API 사용 보장**
- IDE 자동 완성, 리팩토링 지원 등으로 **개발 생산성과 협업 효율성 증가**
- 프론트엔드와 백엔드를 포함한 전체 JS/TS 스택에서 **일관된 타입 정의** 유지
- JavaScript에 비해 **대규모 모바일 앱 프로젝트 관리에 적합**, 유지보수 및 코드 가독성 향상

</details>

<details><summary style="font-size: 1.5em; font-weight: bold; margin: 0.83em 0;">2.2. BE</summary>

> Spring Boot는 서비스 중심의 정형 API 처리를, FastAPI는 비정형 AI 처리 영역을 각각 담당합니다.
>

### Spring Boot

- **대규모 서비스 구조에 적합한 안정성**과 **표준화된 아키텍처 지원**
- 계층 구조 설계, DI, AOP 등 엔터프라이즈 개발 패턴 구현에 강점
- 다양한 Spring 생태계(Spring Security, Spring Data JPA 등)와의 연계가 용이
- 모듈러 모놀리식 구조 설계에 유리하여, 서비스 단위 분리가 용이함

### Java 21

- LTS 버전으로 성능과 보안 측면에서 안정적
- 풍부한 라이브러리와 프레임워크, 오랜 기간 축적된 커뮤니티 지식
- JVM 기반으로 Spring Boot와 자연스럽게 통합

### JPA (Java Persistence API)

- 객체 지향적인 방식으로 관계형 데이터베이스(MySQL) 접근이 가능
- 반복적인 SQL 작성 부담을 줄이고 생산성 향상
- 도메인 모델 중심의 설계(Domain Driven Design)에 유리

### FastAPI (Python)

- AI 모델 연동, OCR 처리, 이미지 생성 등 **비동기 I/O 중심의 AI 서비스 전용 컨트롤러**로 사용
- Python 기반의 AI 프레임워크(OpenAI, Luma, SD3 등)와의 통합이 용이
- 경량 API 서버로써 Spring과 별도로 관리하여 분리된 책임(Separation of Concerns) 확보
- async 기반 처리로 생성 요청 큐, 이미지 응답 처리 등에서 성능 우수

</details>

<details><summary style="font-size: 1.5em; font-weight: bold; margin: 0.83em 0;">2.3. DB</summary>

> MySQL은 Main DB로, Redis, S3은 보조 DB로 사용한다.
>

### MySQL

- **정형화된 관계형 데이터 구조에 적합**
    - 유저, 가게, 리뷰, 이벤트, 메뉴판 등은 모두 명확한 스키마와 관계(1:N, N:1)를 가짐
- **JOIN, 정렬, 필터링 중심 쿼리에 최적화**
    - "가게별 리뷰 최신순", "내가 만든 메뉴판 목록" 같은 복잡한 조회에 효과적
- **ACID 트랜잭션 보장**
    - AI 생성 결과 저장 작업에 안전성 확보
- **운영 안정성과 생태계**
    - 성숙한 도구, ORM(JPA), 백업/복구, 인덱싱, 모니터링 도구가 잘 갖춰져 있음
- **단일 EC2 내 운영 효율**
    - 경량 설정으로도 충분한 성능 확보 가능 (InnoDB + 인덱스 튜닝)

> 처음에는 유저 정보는 MySQL, 피드처럼 구조가 유동적인 데이터는 MongoDB로 분리해서 저장하는 구성을 고려했다. 하지만 현재 인프라가 EC2 한 대로 제한되어 있어, MySQL과 MongoDB를 동시에 운영하면 리소스 분산, 운영 복잡도, 장애 대응 측면에서 부담이 크다고 판단했다.  따라서 모든 핵심 도메인(유저, 가게, 리뷰, 피드 등)은 MySQL 하나로 통합하여 운영하고, 성능 보완이 필요한 부분은 Redis 캐시로 보완하는 방향으로 결정했다.
>

### Redis

- **세션, 캐시, 임시 데이터 처리에 최적화**
    - 로그인 세션 관리, 거리 기반 피드 캐시, 토큰 저장 등에 적합
- **고속 키-값 조회**
    - 거리 필터(100m, 300m 등) 피드 캐싱 시 빠른 응답 보장
- **비동기 작업 Stream 활용 가능**
    - AI 콘텐츠 생성 요청 stream(ex. 이미지 생성, 리뷰 생성 등) 관리에 활용
- **단일 노드 환경에서도 효율적**
    - 설정이 간단하며 메모리 기반이므로 단일 EC2에서도 무리 없이 운영 가능

</details>

<details><summary style="font-size: 1.5em; font-weight: bold; margin: 0.83em 0;">2.4. Infra</summary>

> 단일 EC2(xlarge) 환경이라는 제약 조건 아래에서, 안정적 운영, 서비스 구성 간결화, 자동화 기반 배포를 중심으로 인프라 기술을 선택함
>

### Ubuntu

- **AWS EC2 기본 운영체제**로, 경량/안정적이며 개발자 커뮤니티와 패키지 생태계가 풍부
- 대부분의 DevOps 도구와 친화적이며, 서버 환경 설정 자동화에 유리

### Nginx

- **Reverse Proxy + Static 파일 서빙 + SSL 종단 처리**를 담당
- Spring Boot, FastAPI 등의 백엔드 서비스와 **프론트엔드 정적 자산(React)**을 통합 제공
- URL 라우팅, 캐시 제어, 요청 제한 등 **경량 API Gateway 역할**도 수행

### Docker

- Spring Boot, FastAPI, Jenkins, Nginx 등 모든 컴포넌트를 **컨테이너 단위로 분리**
- 의존성 격리와 배포 일관성을 확보하고, docker-compose를 통해 **단일 EC2 내 구성 통합**
- FastAPI와 Python 기반 AI 컴포넌트도 Docker로 독립 실행 가능

### AWS EC2 (xlarge)

- 현재 과제 제공 조건에 따라 **4vCPU / 16GB RAM / 320GB SSD의 단일 EC2 인스턴스 사용**
- 이 제약으로 인해, **모놀리식 또는 모듈러 모놀리식 아키텍처**로 통합 운영 전략을 선택
- **단일 노드 기반 Redis, MySQL, Docker 기반 구성**으로 자원 분산 최소화 및 관리 효율화

### Prometheus + Grafana

- **Spring Boot, Redis, MySQL 등의 메트릭 수집 및 시각화를 위해 통합 구성**
- Prometheus가 각 서비스의 메트릭을 수집하고, Grafana에서 **성능 분석, 리소스 사용량 시각화**
- 개발 단계에서도 **GC 동작, 메모리/CPU 사용, 비동기 큐 처리량** 등을 확인하여 성능 병목 사전 파악 가능

</details>

<details><summary style="font-size: 1.5em; font-weight: bold; margin: 0.83em 0;">2.5. AI</summary>

> AI 구성 요소는 숏폼 비디오 생성, 지능형 프롬프트 엔지니어링, OCR 기반 영수증 인증, 그리고 동적인 이벤트 및 메뉴 이미지 생성 등 다양한 핵심 기능을 담당한다.
>

### 2.5.1. 숏폼 비디오 생성 AI 모델 (Luma AI & Gen-4)

- 숏폼 비디오 생성에는 **Luma AI**와 **RunwayML의 Gen-4** 두 모델로 구성
- 두 모델 모두 API 접근성을 제공하여 백엔드 서비스와의 원활한 연동이 가능하다는 장점

→ 초기 구현 단계에서는 API 접근성, 비용 효율성, 그리고 단일 서버 환경에서의 운영 가능성을 고려하여 **Luma AI**와 **RunwayML의 Gen-4**가 가장 적합한 선택이다.

### 2.5.2. 프롬프트 엔지니어링 AI 모델 (GPT-4o)

프롬프트 엔지니어링의 핵심 모델로는 **GPT-4o**를 선정했습니다.

- **다목적 활용 및 유연성:** GPT-4o는 텍스트, 이미지, 음성 등 다양한 모달리티를 이해하고 생성하는 능력이 뛰어나, 다른 AI 서비스에 전달될 프롬프트를 정교하게 다듬고 최적화하는 데 이상적

  → 이를 통해 전반적인 AI 서비스의 품질과 정확도를 향상시킬 수 있습니다.

- **고품질 응답 생성:** 복잡하고 추상적인 요구사항을 명확하고 구체적인 프롬프트로 변환하여, 하위 AI 모델들이 더 정확하고 원하는 결과를 생성하도록 도움
- **쉬운 통합:** OpenAI의 강력한 API를 통해 백엔드 시스템에 손쉽게 통합 가능

### 2.5.3.  OCR 기반 영수증 인증 AI 모델 (NAVER CLOVA OCR)

OCR 기반 영수증 인증, 특히 한국어 영수증 데이터 처리에 있어서는 **네이버 클로바 OCR**을 선택했습니다.

| 항목 | **NAVER CLOVA OCR**  |
| --- | --- |
| **한글 인식 정확도** | **최고 수준 (한글 특화)** |
| **주소 인식 최적화** | 매우 우수 (한글 주소 구조에 익숙함) |
| **구동 방식** | 클라우드 API |
| **API 연동성** | REST API 제공 |
| **무료 여부** | 유료 (초과 과금) - ₩37,500 |
| **모델 구조** | CRAFT + Transformer 기반 |
| **한국어 특화** | **최상 (네이버 자체 한글 엔진)** |
| **속도/응답 시간** | 빠름 |
- **압도적인 한글 인식 정확도:** 네이버 클로바 OCR은 네이버의 방대한 한글 데이터를 기반으로 학습되어, 영수증과 같이 다양한 형식의 한글 텍스트에 대해 **최고 수준의 인식 정확도**를 제공

  → 이는 특히 한글 주소나 불규칙한 레이아웃의 영수증 정보 추출에 필수적

- **간편한 REST API 연동:** 클라우드 기반의 REST API를 제공하여 백엔드 시스템과의 통합이 매우 용이 / 자체 OCR 서버를 구축하고 유지보수하는 복잡성을 줄여줌
- **안정적인 성능 및 속도:** 대규모 서비스에 최적화된 안정적인 성능과 빠른 응답 시간을 보장하여, 사용자 요청에 대한 지연을 최소화
- **운영 부담 경감:** 직접 모델을 설치하고 관리할 필요 없이, 네이버 클라우드 환경에서 모든 처리가 이루어지므로 단일 EC2 서버의 리소스 부담을 줄일 수 있음

→ 비용이 발생하지만, 핵심 비즈니스 로직인 영수증 인증의 정확성과 개발 효율성을 고려할 때 네이버 클로바 OCR은 가장 합리적인 선택

### 2.5.4. 이벤트 및 메뉴판 이미지 생성 AI 모델

> 이미지 생성 AI 모델들은 이미지 내부에 한국어 텍스트를 정확하게 렌더링하는 데 한계가 있습니다. 이러한 제약을 극복하고 고품질의 한국어 텍스트가 포함된 이미지를 생성하기 위해 두 가지 접근 방식을 고려하고 있습니다.
>

### 접근 방식 1: SD3 한국어 텍스트 파인튜닝 (우선 고려)

- **목표:** Stable Diffusion 3 (SD3) 모델을 한국어 텍스트 렌더링에 특화되도록 Lura 기술을 통한 파인튜닝 진행 후 AI가 직접 정확한 한글 텍스트를 이미지에 삽입할 수 있도록 진행합니다.
- **장점:**
    - **자연스러운 통합:** AI가 이미지와 텍스트를 함께 생성하므로, 텍스트가 이미지의 맥락과 더 자연스럽게 어우러질 가능성이 높음
    - **단일 워크플로우:** 이미지 생성과 텍스트 삽입이 하나의 AI 모델 내에서 이루어져 전체 워크플로우를 간소화 가능

### 접근 방식 2: 영어로 텍스트 출력  (대안 1)

- **목표:** 이미지 생성 AI 모델이 한국어 텍스트를 직접 생성하는 대신, 모델이 더 잘 처리할 수 있는 **영어로 텍스트를 생성**하게 유도합니다.
- **장점:**
    - **AI 모델의 강점 활용:** 대다수의 이미지 생성 AI 모델(SD3, Midjourney 등)은 영어 텍스트 생성에 있어 한국어보다 훨씬 뛰어난 성능을 보입니다. 모델의 강점을 활용하여 초기 이미지의 품질을 높일 수 있음
    - **유연한 디자인:** 사용가자 AI로 생성한 '텍스트가 들어갈 자리'의 레이아웃은 유지하면서 내용만 한국어로 바꿀 수 있어, 디자인의 일관성을 유지하기 용이

### 접근 방식 3: 텍스트 출력 없이 이미지 생성 (대안 2)

- **목표:** 이미지 생성 AI 모델에게 **어떠한 텍스트도 생성하지 않도록 지시**하고, 순수하게 비주얼 요소만으로 구성된 이미지를 생성하게 한 뒤, **별도의 그래픽 처리 모듈이 이미지 위에 한국어 텍스트를 완전히 새로 렌더링하여 삽입**하는 방식입니다.
- **장점:**
    - **이미지 품질 보장:** AI 모델의 텍스트 생성 한계를 완전히 우회하므로, 텍스트 깨짐, 오타 등의 문제가 발생할 여지가 없음
    - **AI 모델 복잡성 감소:** AI 모델은 오직 이미지의 비주얼 요소 생성에만 집중하므로, 프롬프트 엔지니어링이 상대적으로 단순해지고 예측 가능한 결과물을 얻기 쉬움

</details>

---

# 3. 아키텍처

<img src="https://i.imgur.com/twJ0i4L.png" width="80%">

<details><summary style="font-size: 1.5em; font-weight: bold; margin: 0.83em 0;">3.1. Blue Green Deployment</summary>

<img src="https://i.imgur.com/4GXNlA0.png" width="60%">

설명 필요

</details>

<details><summary style="font-size: 1.5em; font-weight: bold; margin: 0.83em 0;">3.2. Redis Cache</summary>

<img src="https://i.imgur.com/sRzly1P.png" width="60%">

### 캐싱 전략: 멀티 레벨 캐시 구조

성능 최적화를 위해, 본 프로젝트에서는 **2단계(Multi-Level) 캐시 구조**를 도입했습니다.

- **L1 캐시 (Application Level)**
    - 사용 기술: `Caffeine` (내부 메모리 기반)
    - 저장 대상: **핫스팟 데이터만** 저장
    - 특징: 초고속 응답, GC 관리 주의 필요
- **L2 캐시 (Shared External)**
    - 사용 기술: `Redis`
    - 저장 대상: **핫스팟 포함 전체 데이터**
    - 특징: 분산 환경에서 캐시 일관성 유지 및 공유 가능

이 구조를 통해 다음과 같은 장점을 확보했습니다:

- 요청에 따라 L1 → L2 → DB 순으로 접근
- L1에 없는 경우 L2에서 빠르게 조회 후 L1에 재캐싱
- Redis는 TTL과 메모리 정책을 유연하게 설정 가능
- 핫 데이터는 애플리케이션 레벨에서 ultra-low latency로 제공

</details>

<details><summary style="font-size: 1.5em; font-weight: bold; margin: 0.83em 0;">3.3. Redis Streams</summary>

<img src="https://i.imgur.com/p2QYqIW.png" width="60%">

핵심 기능인 **AI 기반 콘텐츠 자동 생성**은 처리 시간이 상대적으로 길기 때문에, **비동기 처리 구조**가 필수적입니다. 이에 따라 다음과 같은 설계를 적용했습니다:

- **비동기 메시징 처리**를 위해 `Redis Streams`를 채택
    - 메시지 순서 보장, 실패 시 재처리, DLQ(Dead Letter Queue) 처리 등 **운영 안정성 확보에 유리**
- **적용 대상 콘텐츠**
    - 리뷰 에셋 생성
    - 메뉴 포스터 생성
    - 이벤트 배너/에셋 생성
- **사용하는 메시지 키**
    - `review.asset.generate`
    - `menu.poster.generate`
    - `event.asset.generate`

</details>

---

# 4. ERD

<img src="https://i.imgur.com/zJspPYs.png" width="50%">

<details><summary style="font-size: 1.5em; font-weight: bold; margin: 0.83em 0;">4.1. DDL(MySql)</summary>

## 4.1. DDL(MySql)

``` sql
-- 사용자 테이블: 로컬 및 소셜 로그인 사용자 정보 저장
CREATE TABLE user (
  id BIGINT AUTO_INCREMENT PRIMARY KEY, -- 사용자 고유 ID
  email VARCHAR(255) NOT NULL UNIQUE,   -- 로그인용 이메일 (고유)
  password VARCHAR(255),                -- 비밀번호 (소셜 로그인은 NULL)
  nick_name VARCHAR(50) NOT NULL UNIQUE, -- 사용자 닉네임 (고유)
  role VARCHAR(20) NOT NULL COMMENT 'EATER or MAKER', -- 사용자 역할
  provider VARCHAR(20) COMMENT 'GOOGLE, KAKAO', -- 소셜 로그인 제공자
  provider_id VARCHAR(100),             -- 소셜 제공자의 사용자 고유 ID
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP, -- 생성 시각
  updated_at DATETIME                   -- 수정 시각
);

-- 음식 태그 테이블: 선호 음식 키워드 정의 및 기타 입력 포함
CREATE TABLE food_tag (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(50) NOT NULL UNIQUE,                -- 음식 이름 (예: 떡볶이)
);

-- 사용자-음식 태그 연결 테이블
CREATE TABLE user_food_tag (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  user_id BIGINT NOT NULL,                         -- 사용자 ID (FK)
  food_tag_id BIGINT NOT NULL,                     -- 음식 태그 ID (FK)
  UNIQUE KEY uk_user_food (user_id, food_tag_id),
  INDEX idx_food_tag_id (food_tag_id),
  FOREIGN KEY (user_id) REFERENCES user(id),
  FOREIGN KEY (food_tag_id) REFERENCES food_tag(id)
);

-- 가게 정보 테이블
CREATE TABLE store (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,              -- 가게명
  address VARCHAR(255) NOT NULL,           -- 주소
  latitude DOUBLE NOT NULL,                -- 위도
  longitude DOUBLE NOT NULL,               -- 경도
  license_url TEXT NOT NULL,               -- 사업자 등록증 파일 URL
  h3_index7 BIGINT,
  h3_index8 BIGINT,
  h3_index9 BIGINT,
  h3_index10 BIGINT,
  maker_id BIGINT NOT NULL,                -- 가게 소유자 (user FK)
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME,
  FOREIGN KEY (maker_id) REFERENCES user(id)
);

-- POI(Point of Interest) 정보 (예: 건물, 지하철역 등)
CREATE TABLE poi (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100),
  category VARCHAR(100),                -- 카테고리 (예: subway, mall)
  latitude DOUBLE NOT NULL,
  longitude DOUBLE NOT NULL,
  raw_code VARCHAR(50)                  -- 외부 연동용 코드
  h3_index_7 BIGINT,
  h3_index_8 BIGINT,
  h3_index_9 BIGINT,
  h3_index_10 BIGINT,
  INDEX idx_h3_7 (h3_index_7),
  INDEX idx_h3_8 (h3_index_8),
  INDEX idx_h3_9 (h3_index_9),
  INDEX idx_h3_10 (h3_index_10)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- POI와 가게 간 거리 정보 (캐시 목적)
CREATE TABLE poi_distance (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  poi_id BIGINT NOT NULL,
  store_id BIGINT NOT NULL,
  distance INT NOT NULL,                -- 거리 (미터)
  UNIQUE KEY uk_poi_store (poi_id, store_id), -- 동일 쌍 중복 방지
  INDEX idx_poi_id (poi_id),
  FOREIGN KEY (poi_id) REFERENCES poi(id),
  FOREIGN KEY (store_id) REFERENCES store(id)
);

-- 메뉴 테이블
CREATE TABLE menu (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,           -- 메뉴명
  price INT NOT NULL,                   -- 가격
  description TEXT,                     -- 설명
  path TEXT,                       -- 이미지 경로
  store_id BIGINT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME,
  UNIQUE KEY uk_store_menu (store_id, name), -- 동일 가게 내 메뉴명 중복 방지
  INDEX idx_store_id (store_id),
  FOREIGN KEY (store_id) REFERENCES store(id)
);

-- 리뷰 테이블
CREATE TABLE review (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  user_id BIGINT NOT NULL,
  store_id BIGINT NOT NULL,
  description TEXT,           -- 리뷰 내용
	status ENUM('PENDING', 'SUCCESS', 'FAIL') NOT NULL DEFAULT 'PENDING' COMMENT '처리 상태',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME,
  INDEX idx_store_id (store_id),
  FOREIGN KEY (user_id) REFERENCES user(id),
  FOREIGN KEY (store_id) REFERENCES store(id)
);

-- 리뷰에 포함된 메뉴 목록
CREATE TABLE review_menu (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  review_id BIGINT NOT NULL,
  menu_id BIGINT NOT NULL,
  UNIQUE KEY uk_review_menu (review_id, menu_id), -- 중복 방지
  INDEX idx_review_id (review_id),
  FOREIGN KEY (review_id) REFERENCES review(id),
  FOREIGN KEY (menu_id) REFERENCES menu(id)
);

-- 리뷰 기반 생성된 AI 자산 (이미지, 숏폼 등)
CREATE TABLE review_asset (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  review_id BIGINT NOT NULL UNIQUE,
  type VARCHAR(20) NOT NULL COMMENT 'SHORTS or IMAGE',
  image_url TEXT,                       -- 이미지 or 썸네일 url
  shorts_url TEXT,                      -- 쇼츠 url
  thumbnail_path TEXT,                  -- 썸네일 path                                 
	prompt TEXT NOT NULL,                          -- 프롬프트
	status ENUM('PENDING', 'SUCCESS', 'FAIL') NOT NULL DEFAULT 'PENDING' COMMENT '처리 상태',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME,
  FOREIGN KEY (review_id) REFERENCES review(id)
);

-- 리뷰 스크랩(북마크) 정보
CREATE TABLE review_scrap (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  user_id BIGINT NOT NULL,
  review_id BIGINT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uk_user_review (user_id, review_id), -- 중복 방지
  INDEX idx_user_id (user_id),
  FOREIGN KEY (user_id) REFERENCES user(id),
  FOREIGN KEY (review_id) REFERENCES review(id)
);

-- 이벤트 테이블
CREATE TABLE event (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  store_id BIGINT NOT NULL,
  title VARCHAR(100) NOT NULL,         -- 이벤트 제목
  description TEXT,
  start_at DATETIME NOT NULL,          -- 시작일
  end_at DATETIME NOT NULL,            -- 종료일
	status ENUM('PENDING', 'SUCCESS', 'FAIL') NOT NULL DEFAULT 'PENDING' COMMENT '처리 상태',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME,
  INDEX idx_store_id (store_id),
  FOREIGN KEY (store_id) REFERENCES store(id)
);

-- 이벤트용 AI 이미지 (포스터)
CREATE TABLE event_asset (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  event_id BIGINT NOT NULL UNIQUE,
  type VARCHAR(20) NOT NULL COMMENT 'IMAGE',
  path TEXT,
	prompt TEXT NOT NULL,                          -- 프롬프트
	status ENUM('PENDING', 'SUCCESS', 'FAIL') NOT NULL DEFAULT 'PENDING' COMMENT '처리 상태',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME,
  FOREIGN KEY (event_id) REFERENCES event(id)
);

-- 메뉴 기반 포스터 생성 요청
CREATE TABLE menu_poster (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  user_id BIGINT NOT NULL,
  store_id BIGINT NOT NULL,
  description TEXT,            -- 요청 설명
  is_sent BOOLEAN DEFAULT FALSE,        -- 발송 여부
	status ENUM('PENDING', 'SUCCESS', 'FAIL') NOT NULL DEFAULT 'PENDING' COMMENT '처리 상태',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME,
  INDEX idx_store_id (store_id),
  FOREIGN KEY (user_id) REFERENCES user(id),
  FOREIGN KEY (store_id) REFERENCES store(id)
);

-- 포스터에 포함된 메뉴 목록
CREATE TABLE menu_poster_menu (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  menu_poster_id BIGINT NOT NULL,
  menu_id BIGINT NOT NULL,
  UNIQUE KEY uk_poster_menu (menu_poster_id, menu_id), -- 중복 방지
  INDEX idx_menu_poster_id (menu_poster_id),
  FOREIGN KEY (menu_poster_id) REFERENCES menu_poster(id),
  FOREIGN KEY (menu_id) REFERENCES menu(id)
);

-- 메뉴 포스터 결과물
CREATE TABLE menu_poster_asset (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  menu_poster_id BIGINT NOT NULL UNIQUE,
  type VARCHAR(20) NOT NULL COMMENT 'IMAGE',
  path TEXT,
	prompt TEXT NOT NULL,                          -- 프롬프트
	status ENUM('PENDING', 'SUCCESS', 'FAIL') NOT NULL DEFAULT 'PENDING' COMMENT '처리 상태',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME,
  FOREIGN KEY (menu_poster_id) REFERENCES menu_poster(id)
);

CREATE TABLE adopted_menu_poster (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  store_id BIGINT NOT NULL,                -- 채택된 가게 ID
  menu_poster_id BIGINT NOT NULL,          -- 채택된 메뉴판 ID
  adopted_at DATETIME DEFAULT CURRENT_TIMESTAMP, -- 채택 시각
  sort_order INT DEFAULT 0,                -- 노출 순서 (옵션: UI 정렬 제어용)

  UNIQUE KEY uk_store_poster (store_id, menu_poster_id),  -- 동일 메뉴판 중복 채택 방지
  INDEX idx_store_id (store_id),
  
  FOREIGN KEY (store_id) REFERENCES store(id),
  FOREIGN KEY (menu_poster_id) REFERENCES menu_poster(id)
);

-- AI 생성의 입력 이미지 (로컬 업로드 이미지 등)
CREATE TABLE asset_source (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  target_type VARCHAR(20) NOT NULL COMMENT 'MENU or REVIEW or EVENT or MENU_POSTER or OCR', -- 연관 타입
	status ENUM('PENDING', 'SUCCESS', 'FAIL') NOT NULL DEFAULT 'PENDING' COMMENT '처리 상태',
  image_url TEXT NOT NULL,                   -- 업로드 이미지 경로
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  -- 인덱스 생략: 조회 없음, 생성 후 삭제되므로
  -- spring scheduler or Batch로 24시간마다 삭제할 예정
);
```

</details>

---

# 5. 기능

<details><summary style="font-size: 1.5em; font-weight: bold; margin: 0.83em 0;">5.1. 핵심 기능</summary>

<details><summary style="font-size: 1.2em; font-weight: bold; margin: 0.83em 0;">5.1.1 리뷰</summary>

- #### 리뷰 asset 생성 요청(React Native --> Spring)
    <img src="https://i.imgur.com/NY5y1jC.png" width="60%">

- #### 리뷰 asset 생성 요청(Spring --> Redis Streams)
    <img src="https://i.imgur.com/LhkcKmd.png" width="60%">

- #### 리뷰 asset 콜백(Fast API --> Spring)
    <img src="https://i.imgur.com/rsB0bfm.png" width="60%">

- #### 리뷰 asset 결과 조회(React Native --> Spring, Polling)
    <img src="https://i.imgur.com/fGJZW8p.png" width="60%">
- 
- #### 리뷰 최종 등록
    <img src="https://i.imgur.com/m5fgiZq.png" width="60%">

- #### PENDING, FAIL 객체 삭제
  <img src="https://i.imgur.com/7cYkVl4.png" width="60%">

</details>

<details><summary style="font-size: 1.2em; font-weight: bold; margin: 0.83em 0;">5.1.2. 거리 피드 조회</summary>

- #### 사용자가 거리에 따른 피드를 조회를 시작
    <img src="https://i.imgur.com/djLcmAT.png" width="60%">

- #### L1 캐시에 사용자 근처의 POI와 해당 거리의 가게 정보가 있으면 바로 조회
    <img src="https://i.imgur.com/zfZ8YbS.png" width="60%">

- #### L1 캐시에서 못 찾으면, L2 캐시에서 POI와 해당 거리의 가게 정보 조회
    <img src="https://i.imgur.com/6B1ypE1.png" width="60%">


- #### L2 캐시에 POI와 해당 거리의 가게 정보가 있으면 조회
    <img src="https://i.imgur.com/KOwKHvT.png" width="60%">

- #### 해당 POI가 Hotspot이면 L1 캐시로 승격
    <img src="https://i.imgur.com/3jUy22R.png" width="60%">

- #### 조회한 정보 반환
    <img src="https://i.imgur.com/GpvN17Z.png" width="60%">

---

### **Redis에서도 조회를 못했다면?**

- #### 미스 카운트 증가
    <img src="https://i.imgur.com/cauOIIT.png" width="60%">

- #### Mysql의 store 정보를 조회
    <img src="https://i.imgur.com/bFJj9uj.png" width="60%">

- #### H3 필터링 후 거리 직접 계산
    <img src="https://i.imgur.com/iXx1OPH.png" width="60%">

- #### redis 업데이트
    <img src="https://i.imgur.com/gkh8yHu.png" width="60%">

- #### 핫스팟 체크
    <img src="https://i.imgur.com/mVmQwCa.png" width="60%">

- #### 클라이언트에게 정보 반환
    <img src="https://i.imgur.com/WSZV0BR.png" width="60%">

</details>

</details>


<details><summary style="font-size: 1.5em; font-weight: bold; margin: 0.83em 0;">5.2. 부가 기능</summary>

</details>

# 트러블슈팅

## BE

<details><summary><strong>blue green deployment</strong></summary>

</details>

<details><summary><strong>캐시 무효화 전략 최적화</strong></summary>

**문제 상황**

- 사전 계산된 거리 정보 캐싱
  POI별 주변 가게 목록을 미리 계산해 캐시 저장 → 가게 등록 시 새로운 가게 정보가 캐시에 반영되지 않음
    - 매 요청 시 실시간 거리 계산은 $O(n)$복잡도로 인해 지연 발생

**해결 전략**

1. 공간 인덱싱 도입(H3)
    - H3를 기반으로 [300m, 500m, 700m, 1000m, 2000m]에 대응하는 해상도를 설정해 1차 필터링
    - H3의 장점

      <img src="https://i.imgur.com/kRiV6u0.png" width="50%">

        - H3는 육각형 cell을 사용하는데 이는 삼각형, 사각형보다 대각선 이웃 거리가 균일

            <img src="https://i.imgur.com/IRGBF7i.png" width="20%">

        - 가게가 육각형의 모서리나 꼭짓점 근처에 위치할 경우를 처리하기 위해 한 겹 더 많은 셀을 포함해야 하는데, 이때 삼각형이나 사각형보다 더 적은 수의 셀만 사용하면 됨
2. 핫스팟과 캐시 상태 도입
    - 자주 조회하는 poi를 핫스팟으로 지정 → 기준은 1시간 동안 poiThreshold만큼 조회를 기준으로 함
    - 캐시 상태를 두 개로 구분
        - fresh: DB와 상태가 일치하는 캐시
        - stale: DB와 상태가 일치하지 않는 캐시

   `POI 연관 캐시 상태 == fresh`:

    - 캐시에서 데이터 조회

   `POI 연관 캐시 상태 == stale && POI == isHotSpot`:

    - stale 상태가 오래됐으면 → refresh 후 데이터 조회
    - stale 상태가 적당하면 → 비동기로 refresh, 캐시 데이터 조회

   `else`:

    - refresh 후 데이터 조회



    💡왜 refresh를 비동기로 처리했나요?

    poi 핫스팟의 경우엔 많은 사용자가 접근한다고 가정하면 데이터 반환 속도가 더 중요합니다. 
    예를 들어, 손님이 10000명이 오는 가게엔 새로운 사용자 1명이 접근을 안해도 크게 손실이 없고 반환 속도가 중요하지만, 
    손님이 10명 오는 가게엔 새로운 사용자 1명, 1명이 중요하기 때문에, 반환 속도보단 정확도가 중요합니다. 
    따라서, poi 정보가 유효한 stale 상태라면 refresh를 비동기로 처리하고, refresh 처리가 더 빨리 되어 fresh 상태를 반환해도 좋고, 
    비동기 처리가 느리다면 stale 상태인 데이터를 먼저 보여줘 데이터를 반환하고 refresh합니다.


3. 계층적 캐시 무효화
    - L1 캐시(Caffeine): JVM 힙 메모리 내부 저장, 최대 100개 항목, 60분 TTL
        - 가장 자주 조회되는 핫스팟 데이터만 보관
    - L2 캐시(Redis): Redis 서버, 모든 캐시 데이터 저장

   조회 흐름(`get`)

    1. L1 캐시 확인 → 있으면 캐시 히트
    2. L1 미스 → L2 캐시 확인
    3. L2 캐시 히트 시
        1. 핫스팟이면 L1 승격
    4. 모든 캐시 미스시 빈 리스트 반환하고 미스 카운트 증가
4. 동적 임계값 자동 조정
    - CPU: ec2 cpu
    - memory: jvm 메모리
        - L1 캐시는 JVM 힙 메모리 내부에 저장
        - L2 캐시는 네트워크를 통해 접근하지만 JVM에서 직렬화 역직렬화 발생 → JVM 메모리 사용

    - CPU 사용률이 80%를 넘어가면, 핫스팟 범위 확대 → 최소 1시간 동안 50회 조회(stale 캐시를 비동기로 갱신하고 DB 접근 최소화)
    - CPU 사용률이 30%미만이면, 핫스팟 범위 축소 → 최대 1시간 동안 200회 조회(fresh 캐시 비중 증가로 데이터 신선도 향상)

    - 메모리 사용률이 85% 초과면, cache ttl 시간 감소 (최대 5분)
    - Cache hit 비율이 70% 미만이면, ttl 시간 증가 (최대 60분)
    - Cache의 stale비율이 20% 초과면, 핫스팟 범위 축소
        - ttl 시간 감소가 아닌 핫스팟 범위 축소 인 이유: ttl 시간은 지나면 유효 기간이 만료되 사용하지 못하지만, 핫스팟 범위를 축소하면 해당 데이터가 일반 지역 + stale이면 refresh Cache를 해 최신 상태로 바꾸기 때문


     💡 CPU 사용률은 TTL에도 영향을 받고, 메모리 사용률은 핫스팟 범위에 따라 영향을 받을 것이다. 
        부하테스트를 진행하지 않아서 두 지표 중 어떤 부분이 더 많은 영향을 미치는지는 확인하지 못했지만, 임의로 각 요소들의 임계값을 설정했다.
        설계 당시 예상으론 CPU는 서비스의 모든 로직을 담당하고, redis와 caffeine은 거리와 이미지, 리뷰 생성 등 특정 기능에만 영향을 미치기 때문에, 
        CPU에 더 큰 우선순위를 둘 예정이고, 실질적인 임계값과 핫스팟 범위, TTL 등의 성능 변인들은 그라파나 & 프로메테우스를 이용해 테스트해 나가면서 정할 예정이다.

</details>

<details><summary><strong>Redis Streams 도입</strong></summary>

- #### 서버 내부의 비동기 처리
    <img src="https://i.imgur.com/aF3zlzm.png" width="60%">
  
    - 핵심 기능인 AI 생성은 처리 시간이 길어 비동기가 필수였습니다.
    - 하지만 서버 간 직접 비동기로만 처리하면 
    - 서버 다운 시 요청 손실, 트래픽 급증 시 과부하, 장애 전파 위험이 있어 
    - 내부 비동기만으로는 확장성과 안정성에 한계가 있습니다.
  
- #### 메시지 큐
    
    <img src="https://i.imgur.com/ksFkwv3.png" width="60%">
    
    - 그래서 메시지 큐를 도입해 Producer/Consumer를 분리했습니다.
    - 메시지는 큐에 안전하게 적재되고, 실패 시 재시도, 백프레셔, 느슨한 결합으로 전체 안정성이 높아졌습니다.


- #### 왜 Redis Streams인가
    
    <img src="https://i.imgur.com/1Ma1BcW.png" width="60%">

    - 후보는 RabbitMQ / Redis Queue / Redis Streams 가 있었습니다. 
    - 단일 EC2라 별도 브로커가 필요한 RabbitMQ는 제외했고, Redis Queue는 재처리·순서·DLQ 기본 제공이 없어 운영 부담이 큽니다. 
    - 그래서 저희는 재처리·순서·DLQ를 표준으로 지원하는 Redis Streams를 채택해 생성 파이프라인을 비동기화했습니다.

- #### 시스템 아키텍처 내 Redis Stremas

    <img src="https://i.imgur.com/p2QYqIW.png" width="60%">

    - 대상은 리뷰, 메뉴포스터, 이벤트 에셋이며, 키는 각각 
    - review.asset.generate, menu.poster.generate, event.asset.generate 입니다.

- #### review.asset.generate
    
    <img src="https://i.imgur.com/KwH5Ihf.png" width="60%">

    - 그 중 가장 대표 기능인 리뷰 생성 흐름을 보면, 
    - Spring이 review.asset.generate에 메시지를 발행하고, 
    - FastAPI가 Consumer Group으로 이를 소비합니다.
    - 소비 성공 시 ACK, 실패 시 정책에 따라 재시도 또는 DLQ(Dead Letter Queue) 로 분기합니다.

- #### MAXLEN
    
    <img src="https://i.imgur.com/I8Ad2cI.png" width="60%">

    - 레디스 내 최대 메시지 개수를 2000개로 설정하여, 만약 이를 초과하면 trim(삭제)합니다.

- #### TTL & maxRetryCount

    <img src="https://i.imgur.com/dXeD5P9.png" width="60%">

    - 각 메시지에는 expireAt(TTL)이 들어가며, 리뷰 생성은 5분입니다. 
    - 처리 중 실패하면 최대 3회 재시도 후 DLQ로 보냅니다.

- #### Spring Batch

    <img src="https://i.imgur.com/dXeD5P9.png" width="60%">

    - 스프링 배치가 20분마다 cleanerJob을 실행합니다. 
    - TTL이 만료됐거나 유효성 에러, 각종 시스템 에러로 인해 실패한 메시지들을 지워줍니다.


</details>

<details><summary><strong>로그 적용 일대기</strong></summary>

</details>

<details><summary><strong>파일 최적화 저장</strong></summary>

</details>