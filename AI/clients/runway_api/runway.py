# main2로 바뀔 예정입니다.
import os
import sys
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
import asyncio
from runwayml import AsyncRunwayML
from dotenv import load_dotenv
import requests
from gms_api.gpt import generate_gen4_prompt 

load_dotenv()

# The env var RUNWAYML_API_SECRET is expected to contain your API key.
client = AsyncRunwayML(
    api_key = os.environ.get('RUNWAY_API_KEY'),
)

# RunwayML 작업을 실행할 비동기 함수 정의
async def run_runway():
    user_initial_prompt = input("초기 프롬프트를 입력하세요-테스트용: ")
    await asyncio.sleep(3) # 3초 대기합니다. (비동기 작업을 위해 asyncio 사용)
    
    print("쇼츠 생성중입니다!!! 잠시 기다리세요 >< !! \n" )
    
    detailed_gen4_prompt = await generate_gen4_prompt(user_initial_prompt)
    print(detailed_gen4_prompt)

    '''
    model : 모델의 종류가 많으나, 성능-비용 측면에서 gen4_turbo로 고정합니다.

    prompt_image : 비디오 생성에 사용할 비디오 url을 넣습니다.

    prompt_text : 비디오 생성에 사용할 텍스트 프롬프트를 설정합니다.

    duration: 비디오 길이를 설정합니다. -> 5s or 10s (5초- or 10초 - )
    
    ratio : 비디오 화면 비율을 설정합니다( 1280:720, 720:1280, 1104:832, 832:1104, 960:960, 1584:672)
    '''

    # task 생성을 기다립니다 (await 사용)
    task = await client.image_to_video.create(
        model='gen4_turbo',
        prompt_image="https://storage.googleapis.com/be_my_logo/am_i_being_a_king.jpg",
        prompt_text=detailed_gen4_prompt,
        ratio='720:1280',
        duration = 10
    )

    # 상태 확인 루프(polling)
    completed = False
    while not completed:
        current_task_status = await client.tasks.retrieve(id=task.id) # 현재 작업 상태를 가져옵니다.
        if current_task_status.status == "SUCCEEDED":
            print("생성 완료!!")
            completed = True
            task = current_task_status
            break
        elif current_task_status.status != "SUCCEEDED":
            if current_task_status.failure: # 실패 정보가 있다면
                raise RuntimeError(f"생성 실패: {current_task_status.failure}")
            else: # 실패 정보는 없지만 아직 완료되지 않았다면
                print("Dreaming")
        await asyncio.sleep(5) # completed 가 True 될때 까지 5초 간격으로 반족 조회(polling)


    # 영상 다운로드
    video_url = task.output[0]
    print("영상 다운로드 중...")
    response = requests.get(video_url, stream=True)
    response.raise_for_status() # HTTP 요청이 실패했을 때 오류를 발생시킵니다. (선택 사항이지만 넣으면 좋다고 한다..?왜지?)

    with open(f'{task.id}.mp4', 'wb') as file:
        file.write(response.content)

    print(f"File downloaded as {task.id}.mp4")
    print(f"Video URL: {video_url}")



# 비동기 함수 실행
if __name__ == "__main__":
    asyncio.run(run_runway())