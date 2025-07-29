import requests
import json
import re # 가격 패턴 매칭을 위한 정규표현식 사용
import time
import uuid
from dotenv import load_dotenv
import os

# 문자열에 한글 글자가 있으면 인식합니다
def is_hangul(s):
    return any('\uac00' <= ch <= '\ud7a3' for ch in s)

# 문자열이 가격 형식인지 확인합니다 (숫자, 소수점, 콤마 허용)
def is_price(s):
    # 숫자, 소수점, 콤마 허용
    return re.match(r'^\d+([.,]\d+)?$', s) is not None

# 환경 변수 로드
load_dotenv()
secret_key = os.environ.get("CLOVA_MENU_SECRET_KEY")
api_url     = os.environ.get("CLOVA_MENU_API_URL")
img_path    = "test_menu_board2.jpg"
ocr_json    = "ocr_menu_board2.json"
out_json    = "extracted_menus2.json"

# 1) OCR 요청 및 결과 저장
# 이미지 파일을 바이너리 모드로 열어 손상 없이 전송
# request를 통해 api 요구사항에 맞춰 json 요청 전송
with open(img_path, "rb") as img_file:
    files = [("file", img_file)]
    request_payload = {
        "images": [{"format": "jpg", "name": "demo"}],
        "requestId": str(uuid.uuid4()),
        "version": "V2",
        "timestamp": int(time.time() * 1000),
    }
    payload = {"message": json.dumps(request_payload).encode("utf-8")}
    headers = {"X-OCR-SECRET": secret_key}
    
    # POST 요청으로 OCR API 호출
    resp = requests.post(api_url, headers=headers, data=payload, files=files)
    # 오류 시 예외 발생을 위함입니다.
    # raise_for_status()를 호출 시 응답 코드가 200~299가 아니면
    # (예: 400, 404, 500 등)
    # 자동으로 HTTPError 예외 발생 
    resp.raise_for_status()
    result = resp.json()

with open(ocr_json, "w", encoding="utf-8") as f:
    json.dump(result, f, indent=2, ensure_ascii=False)
print(f"[OK] OCR 결과가 '{ocr_json}'에 저장되었습니다.")

# 2) fields 그룹화 (lineBreak 기준)
# row로 그룹핑을 진행합니다.
# lineBreak가 True가 나오면 그 지점까지를 한 줄로 보고 groups에 추가
fields = result["images"][0]["fields"]
groups, curr = [], []
for fld in fields:
    curr.append(fld)
    if fld.get("lineBreak", False):
        groups.append(curr)
        curr = []
if curr:
    groups.append(curr)

# 3) 메뉴명–가격 파싱
# texts에는 한 줄에 속한 inferText가 들어갑니다.
# 기본형 : [메뉴명, 가격]
# 옵션형 : [Hot/Ice 메뉴명, 가격...] 형태 → “(Hot)”, “(Ice)” 분리
menu_prices = []
for grp in groups:
    texts = [f["inferText"].strip() for f in grp]
    if not texts or not is_hangul(texts[0]):
        continue

    # 기본 메뉴 + 가격
    if len(texts) >= 2 and is_price(texts[1]):
        menu_prices.append((texts[0], texts[1]))

    # Hot/Ice 옵션
    if len(texts) >= 4 and is_hangul(texts[2]) and is_price(texts[3]):
        menu_prices.append((f"{texts[2]} (Hot)", texts[3]))
        if len(texts) >= 5 and is_price(texts[4]):
            menu_prices.append((f"{texts[2]} (Ice)", texts[4]))


# 4) JSON 포맷으로 변환 & 저장 (소수점 처리 로직 포함)
extracted = {"extractedMenus": []}
for name, price_str in menu_prices:
    raw = price_str.strip()
    # 소수점 한 자리(예: "8.0")는 천 단위 구분자로 간주
    if re.match(r'^\d+\.\d$', raw):
        price = int(float(raw) * 1000)
    else:
        # 콤마 제거 후 정수로 변환
        try:
            price = int(raw.replace(",", ""))
        except ValueError:
            price = None

    extracted["extractedMenus"].append({
        "name": name,
        "price": price
    })

with open(out_json, "w", encoding="utf-8") as f:
    json.dump(extracted, f, indent=2, ensure_ascii=False)
# python의 json.dump()는 기본적으로 UTF-8 인코딩을 사용합니다.
# 이 경우 한글 같은 비 ASCII 문자는 uac00같은 유니코드 이스케이프 형태로 저장
# ensure_ascii=False를 설정하면 한글이 그대로 저장됩니다.

print(f"[OK] 추출된 메뉴 정보가 '{out_json}'에 저장되었습니다.")
print("\n추출된 메뉴명 → 가격 목록:")
for item in extracted["extractedMenus"]:
    print(f"· {item['name']} → {item['price']}원")
