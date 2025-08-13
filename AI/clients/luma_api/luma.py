import os
from lumaai import AsyncLumaAI
from dotenv import load_dotenv
import requests # 영상 URL에서 파일 다운로드 할 떄 사용
import time # 일정 시간 간격으로 상태 확인
import asyncio # 비동기 작업을 위해 asyncio 라이브러리 추가
import sys
from gms_api.gpt import generate_luma_prompt 

load_dotenv()

client = AsyncLumaAI(
    auth_token = os.environ.get("LUMAAI_API_KEY"),
)

# 영상 생성 요청
async def run_luma():
    user_initial_prompt = input("초기 프롬프트를 입력하세요-테스트용: ")
    await asyncio.sleep(3) # 3초 대기합니다. (비동기 작업을 위해 asyncio 사용)
    
    print("쇼츠 생성중입니다!!! 잠시 기다리세요 >< !! \n" )
    
    detailed_luma_prompt = await generate_luma_prompt(user_initial_prompt)
    print(detailed_luma_prompt)
    
    '''
    prompt: 비디오 생성에 사용할 텍스트 프롬프트를 설정합니다.

    model: 사용할 비디오 생성 모델을 설정합니다. 여러개가 있으나, 기능 + 비용 측면에서 ray-2로 고정하고 사용합니다.

    resolution: 비디오 해상도를 설정합니다. (540p, 720p, 1080p, 4k)

    duration: 비디오 길이를 설정합니다. -> 5s or 9s (5초 : 80-100s or 9초 : 160-190s)

    loop: 비디오를 루프 가능한 형태로 생성합니다. (True 또는 False)

    aspect_ratio: 비디오 화면 비율을 설정합니다. (1:1, 3:4, 4:3, 9:16, 16:9 (default), 9:21,  21:9)

    concepts: 비디오 생성에 특정 시각적 개념을 적용
    '''

    # keyframes를 사용할 때는 loop를 함께 보낼 수 없음
    create_kwargs = {
        "prompt": detailed_luma_prompt,
        "model": "ray-2",
        "aspect_ratio": "9:16",
        "duration": "5s",
        "keyframes": {
            "frame0": {
                "type": "image",
                # url 관련 상세 정보는 notion / 세부 작업 현황 / AI / 쇼츠 생성 ai에 있습니다
                "url": "https://storage.googleapis.com/be_my_logo/am_i_being_a_king.jpg"
            }
        }
    }
    generation = await client.generations.create(**create_kwargs)

    print(f"영상 생성 요청 완료")

    # 상태 확인 루프(polling)
    completed = False
    while not completed:
        generation = await client.generations.get(id=generation.id)
        if generation.state == "completed":
            print("생성 완료!!")
            completed = True
            break
        elif generation.state == "failed":
            raise RuntimeError(f"생성 실패: {generation.failure_reason}")
        print("Dreaming")
        await asyncio.sleep(5) # completed 가 True 될때 까지 5초 간격으로 반족 조호ㅢ(polling)

    # 영상 다운로드
    video_url = generation.assets.video
    print("영상 다운로드 중...")
    response = requests.get(video_url, stream=True)
    
    with open(f'{generation.id}.mp4', 'wb') as file:
        file.write(response.content)

    print(f"File downloaded as {generation.id}.mp4")
    print(f"Video URL: {video_url}")

    '''
    모든 비디오 목록 조회:
    client.generations.list(limit=100, offset=0)를 사용하여 생성된 비디오 목록을 가져옵니다. limit와 offset으로 페이징할 수 있습니다.
    이 부분은 필요하다면 main 함수 내에서 호출할 수 있음.
    all_generations = await client.generations.list(limit=100, offset=0)
    print(f"Total generations: {len(all_generations)}")
    '''

# main 함수 실행
if __name__ == "__main__":
    asyncio.run(run_luma())