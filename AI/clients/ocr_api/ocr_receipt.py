import requests
import json
import base64
import time
import uuid
from dotenv import load_dotenv
import os

load_dotenv()

# 네이버 클로바 OCR API 정보
secret_key = os.environ.get("CLOVA_RECEIPT_SECRET_KEY")
api_url = os.environ.get("CLOVA_RECEIPT_API_URL")
img = 'test_receipt1.jpg'

files = [
  ('file', open(img,'rb'))
]

request_json = {
    'images': [
        {
            'format': 'jpg',
            'name': 'demo'
        }
    ],
    'requestId': str(uuid.uuid4()),
    'version': 'V2',
    'timestamp': int(round(time.time() * 1000))
}

payload = {'message': json.dumps(request_json).encode('UTF-8')}

headers = {
  'X-OCR-SECRET': secret_key
}

response = requests.request("POST", api_url, headers=headers, data = payload, files = files)
result = response.json()
output_filename = "ocr_result.json" # 원하는 파일명으로 변경
with open(output_filename, 'w', encoding='utf-8') as f:
    json.dump(result, f, indent=2, ensure_ascii=False)

print(f"OCR 결과가 '{output_filename}' 파일에 저장되었습니다.")

