"""
리팩토링된 메뉴보드 OCR 클라이언트
menuboard_ocr_models.py의 모델을 사용하도록 수정된 버전
"""

import json
from dotenv import load_dotenv
import os
from services.ocr_menuboard_service import ocr_menuboard_service
from models.ocr_menuboard_models import OCRMenuRespond, ExtractedMenu
import asyncio

# 환경 변수 로드
load_dotenv()

# 테스트용 파일 경로
img_path = "test_menu_board2.jpg"
ocr_json = "ocr_menu_board2.json"
out_json = "extracted_menus2.json"


async def process_menu_board_with_models():
    """
    menuboard_ocr_models를 사용하여 메뉴보드 이미지를 처리합니다.
    """
    try:
        # 1) 이미지 파일 읽기
        with open(img_path, "rb") as img_file:
            image_data = img_file.read()
        
        # 2) OCR 서비스를 통해 메뉴 추출
        extracted_menus = await ocr_menuboard_service.extract_menus_from_image(
            image_data, "jpg"
        )
        
        # 3) OCRMenuRespond 모델로 응답 구성
        response = OCRMenuRespond(
            sourceId=1,  # 테스트용 sourceId
            result="SUCCESS",
            extractedMenus=extracted_menus
        )
        
        # 4) JSON 결과 저장
        with open(out_json, "w", encoding="utf-8") as f:
            json.dump(response.model_dump(), f, indent=2, ensure_ascii=False)
        
        print(f"[OK] 추출된 메뉴 정보가 '{out_json}'에 저장되었습니다.")
        print("\n추출된 메뉴명 → 가격 목록:")
        for item in extracted_menus:
            print(f"· {item.name} → {item.price}원")
            
        return response
        
    except Exception as e:
        print(f"❌ 메뉴보드 처리 실패: {e}")
        # 실패 시에도 OCRMenuRespond 모델로 응답
        response = OCRMenuRespond(
            sourceId=1,
            result="FAIL",
            extractedMenus=[]
        )
        
        with open(out_json, "w", encoding="utf-8") as f:
            json.dump(response.model_dump(), f, indent=2, ensure_ascii=False)
        
        return response


if __name__ == "__main__":
    # 비동기 함수 실행
    result = asyncio.run(process_menu_board_with_models())
    print(f"\n처리 결과: {result.result}")
    print(f"추출된 메뉴 개수: {len(result.extractedMenus)}")
