import os
import json
from PIL import Image

# JSON 파일 경로
json_file_path = "C:\\Users\\SSAFY\\Desktop\\printed_data_info.json"

# 이미지 파일들이 들어있는 폴더 경로
images_source_dir = "C:\\Users\\SSAFY\\Desktop\\word"

# 전처리된 학습 데이터를 저장할 최종 폴더
output_data_dir = "C:\\Users\\SSAFY\\Desktop\\after"

# --- 출력 디렉토리 생성 ---
os.makedirs(output_data_dir, exist_ok=True)

# --- JSON 파일 로드 ---
try:
    with open(json_file_path, 'r', encoding='utf-8') as f:
        data = json.load(f)
    print(f"JSON 파일 '{json_file_path}' 로드 완료.")
except FileNotFoundError:
    print(f"오류: JSON 파일을 찾을 수 없습니다. 경로를 확인하세요: {json_file_path}")
    exit()
except json.JSONDecodeError:
    print(f"오류: JSON 파일 파싱에 실패했습니다. 파일 내용이 올바른 JSON 형식인지 확인하세요: {json_file_path}")
    exit()

# 이미지 ID와 파일명 매핑 (효율적인 조회를 위해서!) 
image_id_to_filename = {}
for img_info in data['images']:
    image_id_to_filename[img_info['id']] = img_info['file_name']

print(f"총 {len(data['images'])}개의 이미지 정보와 {len(data['annotations'])}개의 어노테이션 정보가 로드되었습니다.")
print("데이터 전처리를 시작합니다...")

processed_count = 0
skipped_count = 0

# 어노테이션 정보를 기반으로 이미지 복사 및 캡션 파일 생성 
for annotation in data['annotations']:
    image_id = annotation['image_id']
    text_content = annotation['text'] # 캡션으로 사용할 텍스트

    if image_id in image_id_to_filename:
        original_image_filename = image_id_to_filename[image_id]
        original_image_path = os.path.join(images_source_dir, original_image_filename)
        
        # 출력 파일 이름 (이미지 파일과 캡션 파일 모두에 사용)
        base_output_filename = os.path.splitext(original_image_filename)[0] # 확장자 제거
        output_image_path = os.path.join(output_data_dir, original_image_filename)
        output_caption_path = os.path.join(output_data_dir, f"{base_output_filename}.txt")

        # 이미지 파일이 실제로 존재하는지 확인
        if os.path.exists(original_image_path):
            try:
                # 이미지 복사 (Optional: Resize/Pad to 1024x1024 if necessary)
                # SD3 학습에 최적화된 1024x1024 해상도로 이미지를 리사이징/패딩하는 코드
                import shutil
                shutil.copy(original_image_path, output_image_path)

                # 캡션 파일 생성
                with open(output_caption_path, 'w', encoding='utf-8') as f:
                    f.write(text_content)
                processed_count += 1
            except Exception as e:
                print(f"오류: '{original_image_filename}' 처리 중 문제 발생: {e}")
                skipped_count += 1
        else:
            print(f"경고: 원본 이미지 파일 '{original_image_path}'을(를) 찾을 수 없습니다. 건너뜁니다.")
            skipped_count += 1
    else:
        print(f"경고: 어노테이션 ID '{image_id}'에 해당하는 이미지 파일명을 찾을 수 없습니다. 건너뜁니다.")
        skipped_count += 1

print(f"\n데이터 전처리 완료.")
print(f"성공적으로 처리된 파일 쌍: {processed_count}개")
print(f"건너뛴 파일: {skipped_count}개")
print(f"최종 학습 데이터는 '{output_data_dir}'에 저장되었습니다.")