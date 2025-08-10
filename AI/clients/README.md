# AI

## shorts - luma_api / runway_api
- 모델
   - luma_api : ray-2
   - runway_api : gen4_turbo

- 사용방법
1. 최상단 루트에서 가상환경 설정 (python -m venv venv) + 패키지 다운로드 (pip install -r requirements.txt)
2. ~/making_shorts 루트에서 python -m luma_api.luma
   ~/making_shorts 루트에서 python -m runway_api.runway

3. 프롬프트 작성 후 기다리기

4. 영상 url 출력 (ctrl + 좌클릭)후 클릭 시 영상 출력

5. 코드 내부 주요 사항은 기입 해놨으며, 상세 정보는 
    https://www.notion.so/ai-Luma-ai-239bb13c7ad580de85b6e7dd7062457b?source=copy_link
    위 링크 클릭    

## prompt - gms_api
1. shorts ai 생성에 도움을 주는 ai
2. SSAFY에서 제공하는 GMS token으로 사용
3. 모델 : gpt-4o

- 사용방법
   - 자체적으로 사용하지 않고, shorts ai 호출 시 중간에서 자동으로 호출
   - prompt 관련 엔지니어링은 prompt.txt 참고

## ocr - ocr_api
- Naver CLOVA OCR 기반 3가지 모델 사용
   1. 사업자 등록증 인식(ocr_license.py) - 특화 모델
   2. 영수증 인식(ocr_receipt.py) - 특화 모델
   3. 메뉴판 인식(ocr_menu_board.py) - 일반 모델
   
- 특화 모델은 CLOVA 자체 제작 OCR로, 출력되는 json 내부의 field 값이 정해져 있음

- 사용방법
   1. 최상단 루트에서 가상환경 설정 (python -m venv venv) + 패키지 다운로드 (pip install -r requirements.txt)
   2. 사용하고자 하는 모델명 출력 python ocr_~~~~.py



