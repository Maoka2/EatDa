from openai import AsyncOpenAI
import os
import getpass
import asyncio
from dotenv import load_dotenv

load_dotenv()

# 서버 환경에서는 인터랙티브 입력을 사용하지 않습니다.
# GMS_API_KEY가 없으면 즉시 오류를 발생시켜 호출자가 처리하도록 합니다.
if not os.environ.get("GMS_API_KEY"):
  raise RuntimeError("GMS_API_KEY 환경변수가 설정되어 있지 않습니다. .env 또는 실행 환경에 키를 설정하세요.")

# GMS API 클라이언트를 초기화합니다.
# base_url은 GMS API의 엔드포인트로, 실제 서비스에 맞게 설정해야 합니다.
client = AsyncOpenAI(
    api_key=os.environ["GMS_API_KEY"],
    base_url="https://gms.ssafy.io/gmsapi/api.openai.com/v1"
)

# 시스템 메시지 내용 정의
# 이 메시지는 Luma AI의 Ray2 모델이 고품질 영상을 생성하는 데 필요한 지침을 제공하며, 해석본은 prompt.txt입니다.
luma_system_message_content = """
역할
You are a prompt enhancer for Luma’s Dream Machine. Your job is to turn a short, rough user idea into a single, vivid, production-ready English prompt that reads like natural language (not bullet points), while also returning a small JSON block of optional controls (style preset, duration, aspect ratio, camera motion, etc.). You must preserve the user’s intent and expand it with concrete, visual details.

핵심 원칙
1. Write in natural, descriptive English (40-60 words).
2. Be specific about subject, environment, composition, style, mood, lighting, color, camera, motion, 	and key visual elements.
3. If the user includes character or style, keep them exactly as-is and use them.
4. Prefer cinematic, concrete visuals over abstract adjectives. Avoid long lists.
5. Don’t invent protected brands/IP unless explicitly provided.
6. Use sensible defaults without asking follow-ups. Never asking follow-ups

작성 가이드 (내부 체크리스트)
1.Subject: who/what, posture, wardrobe or design cues
2.Environment: place, era, weather, time of day, set dressing
3.Extra: on-frame text (quoted), magazine/poster/cover framing if requested

변환 규칙
1. If user input is very short (e.g., “cyberpunk fashion magazine”), expand it fully using defaults.
2. Keep technical parameters out of the prose; prose should feel like a natural director’s brief.

Do not ask any follow-up questions under any circumstances; proceed with sensible defaults.

예시
입력: "국물이 진짜 맛있었다"
출력: "따끈한 국물이 입안 가득 퍼지며, 깊고 진한 맛이 하루의 피로를 단번에 녹여주었다."

입력: "김밥이 좋았다"
출력: "한입 베어물자 고소한 참기름 향과 부드러운 달걀, 아삭한 채소가 어우러져 행복이 번졌다."

입력: "빵이 너무 맛있었다"
출력: "겉은 바삭하고 속은 폭신한 빵에서 고소한 버터 향이 퍼지며, 달콤한 잼과 완벽하게 어우러졌다."

입력: "커피가 최고였다"
출력: "진하게 우려낸 커피의 깊은 향과 부드러운 쌉싸래함이 아침 공기를 깨우듯 기분을 상쾌하게 만들었다."

입력: "비빔밥이 맛있었다"
출력: "다양한 채소와 고소한 참기름, 매콤한 고추장이 어우러져 한 숟가락마다 풍성한 맛이 터졌다."

입력: "초밥이 좋았다"
출력: "입안에서 부드럽게 녹는 생선의 신선함과 감칠맛이 따뜻한 밥알과 만나 완벽한 조화를 이뤘다."

입력: "파스타가 맛있었다"
출력: "탱글한 면발에 올리브 오일과 허브 향이 스며들어, 한입마다 지중해 바람이 느껴졌다."

"""

gen4_system_message_content = '''
역할
Convert a short user idea and (optionally) an input image into a single-scene, action-focused prompt tailored for Gen-4.
Emphasize what moves and how; treat the image as the visual starting point and the text as the motion description.

핵심 원칙
1. Write in natural, descriptive English (40-60 words).
2. Simplicity first → iterate: start simple, then add one element at a time.
3. Use positive statements and Prioritize concrete actions over abstract feelings or concepts.
4. Refer to subjects generically (“the subject,” “she/he/they”) so the model focuses on smooth motion.

작성 가이드 (내부 체크리스트)
1. Subject Motion: who does what and how; for multiple subjects, use spatial cues or simple identifiers 
2. Scene Motion: how the environment reacts (dust billows, leaves sway). Use implicit cues via adjectives or explicit descriptions to emphasize.
3. Style Descriptors: live-action/animation/stop-motion, pacing, and aesthetic tone to refine results.
4. Avoid: greetings, command phrasing (“please add…”), overstuffed multi-scene plots, contradictory cues, and heavy abstraction.

변환 규칙
1. Expand short inputs into a single-scene action brief covering subject, scene, and camera motion.
2. Convert commands/dialogue → descriptive prose (“add a dog” → “a dog runs in from off-camera”).
3. With an input image, minimize re-describing looks; focus on motion/camera/scene changes.

Do not ask any follow-up questions under any circumstances; proceed with sensible defaults.


예시:
입력: "국물이 진짜 맛있었다"
출력: "따끈한 국물이 입안 가득 퍼지며, 깊고 진한 맛이 하루의 피로를 단번에 녹여주었다."

입력: "김밥이 좋았다"
출력: "한입 베어물자 고소한 참기름 향과 부드러운 달걀, 아삭한 채소가 어우러져 행복이 번졌다."

입력: "빵이 너무 맛있었다"
출력: "겉은 바삭하고 속은 폭신한 빵에서 고소한 버터 향이 퍼지며, 달콤한 잼과 완벽하게 어우러졌다."

입력: "커피가 최고였다"
출력: "진하게 우려낸 커피의 깊은 향과 부드러운 쌉싸래함이 아침 공기를 깨우듯 기분을 상쾌하게 만들었다."

입력: "비빔밥이 맛있었다"
출력: "다양한 채소와 고소한 참기름, 매콤한 고추장이 어우러져 한 숟가락마다 풍성한 맛이 터졌다."

입력: "초밥이 좋았다"
출력: "입안에서 부드럽게 녹는 생선의 신선함과 감칠맛이 따뜻한 밥알과 만나 완벽한 조화를 이뤘다."

입력: "파스타가 맛있었다"
출력: "탱글한 면발에 올리브 오일과 허브 향이 스며들어, 한입마다 지중해 바람이 느껴졌다."

'''


# 이벤트 이미지 전용 시스템 메시지
menuboard_system_message_content = """
역할
Expand a user’s short idea into a concise English prompt optimized for DALL·E 3 that can generate an image of a store menu board.
Be sure to include a note, do not include any form of language or text.

핵심 원칙
1. Write clearly and specifically in 40–100 words, using natural descriptive sentences (not lists).
2. Do not ask the model to draw actual text; instead, instruct it to reserve layout areas where text will go.
3. Briefly include the color palette, mood, style (e.g., modern, minimal, cute, luxurious), and the primary subject (e.g., coffee, bread, desserts).
4. Always emphasize a menu-board-appropriate composition and visual flow (large title area, secondary text area, a clear focal point, etc.).
5. Ensure the image depicts a menu board and maintains that look. Even if the user doesn’t say “menu board,” the output should always look like one.
6. Be sure to include a note, do not include any form of language or text.

출력 형식
Output only the expanded English prompt body. No additional explanations. Be sure to include a note, do not include any form of language or text.
"""

shorts_image_message_content = """
역할
Generate a prompt of approximately 40–60 characters.

핵심 원칙
1. Omit any ordered items that are not present.
2. Output in sentence format without using emojis.
3. If the prompt is too short, enrich it by adding related words associated with the term.
4. If the prompt is too long, summarize it to around 40–60 characters before generating it.
5. If repetitive meaningless text (e.g., “gggg” or “ㅂㅈ다ㅠㅓㅂ”) is entered, create an arbitrary sentence related to food instead.

출력 형식
Output only the expanded English prompt body. No additional explanations. 

예시
입력: "국물이 진짜 맛있었다"
출력: "따끈한 국물이 입안 가득 퍼지며, 깊고 진한 맛이 하루의 피로를 단번에 녹여주었다."

입력: "김밥이 좋았다"
출력: "한입 베어물자 고소한 참기름 향과 부드러운 달걀, 아삭한 채소가 어우러져 행복이 번졌다."

입력: "빵이 너무 맛있었다"
출력: "겉은 바삭하고 속은 폭신한 빵에서 고소한 버터 향이 퍼지며, 달콤한 잼과 완벽하게 어우러졌다."

입력: "커피가 최고였다"
출력: "진하게 우려낸 커피의 깊은 향과 부드러운 쌉싸래함이 아침 공기를 깨우듯 기분을 상쾌하게 만들었다."

입력: "비빔밥이 맛있었다"
출력: "다양한 채소와 고소한 참기름, 매콤한 고추장이 어우러져 한 숟가락마다 풍성한 맛이 터졌다."

입력: "초밥이 좋았다"
출력: "입안에서 부드럽게 녹는 생선의 신선함과 감칠맛이 따뜻한 밥알과 만나 완벽한 조화를 이뤘다."

입력: "파스타가 맛있었다"
출력: "탱글한 면발에 올리브 오일과 허브 향이 스며들어, 한입마다 지중해 바람이 느껴졌다."
"""

# 메인 함수 정의

async def generate_luma_prompt(user_input: str) -> str:
    ''' 
    사용자 입력을 기반으로 Luma AI를 위한 상세한 시각적 프롬프트를 생성
    user_input(str) : 사용자가 입력한 짧은 프롬프트.
    확장된 Luma AI에 최적화된 영어 프롬프트로 return.
    '''
    res_text = ""
    stream = await client.chat.completions.create(
        model='gpt-4o',
        messages=[
            {"role": "system", "content": luma_system_message_content}, 
            {"role": "user", "content": user_input}
        ],
        max_tokens=1024,
        # stream은 토큰을 쪼개서 보낼지 설정합니다.
        # True로 설정하면 응답을 스트리밍 방식으로 받을 수 있습니다.
        # 이 경우, 응답이 완료될 때까지 기다리지 않고, 토큰이 생성되는 대로 처리할 수 있습니다.
        # False로 설정하면 전체 응답을 한 번에 받습니다.
        stream=True,
    ) 
    # 스트리밍 응답을 처리합니다.
    async for chunk in stream:
        if chunk.choices[0].delta.content is not None:
            res_text += chunk.choices[0].delta.content
            # print(chunk.choices[0].delta.content, end="", flush=True)
    return res_text

async def generate_gen4_prompt(user_input: str) -> str:
    ''' 
    사용자 입력을 기반으로 gen4를 위한 상세한 시각적 프롬프트를 생성
    user_input(str) : 사용자가 입력한 짧은 프롬프트.
    확장된 gen4에 최적화된 영어 프롬프트로 return.
    '''
    res_text = ""
    stream = await client.chat.completions.create(
        model='gpt-4o',
        messages=[
            {"role": "system", "content": gen4_system_message_content}, 
            {"role": "user", "content": user_input}
        ],
        max_tokens=1024,
        # stream은 토큰을 쪼개서 보낼지 설정합니다.
        # True로 설정하면 응답을 스트리밍 방식으로 받을 수 있습니다.
        # 이 경우, 응답이 완료될 때까지 기다리지 않고, 토큰이 생성되는 대로 처리할 수 있습니다.
        # False로 설정하면 전체 응답을 한 번에 받습니다.
        stream=True,
    ) 
    # 스트리밍 응답을 처리합니다.
    async for chunk in stream:
        if chunk.choices[0].delta.content is not None:
            res_text += chunk.choices[0].delta.content
            # print(chunk.choices[0].delta.content, end="", flush=True)
    return res_text

async def generate_menuboard_prompt(user_input: str) -> str:
    """
    이벤트 이미지(포스터/배너) 생성을 위한 DALL·E 3 최적화 프롬프트 생성
    user_input(str): 사용자가 입력한 짧은 프롬프트
    return: DALL·E 3에 적합한 확장된 영어 프롬프트
    """
    res_text = ""
    stream = await client.chat.completions.create(
        model='gpt-4o',
        messages=[
            {"role": "system", "content": menuboard_system_message_content},
            {"role": "user", "content": user_input},
        ],
        max_tokens=512,
        stream=True,
    )
    async for chunk in stream:
        if chunk.choices[0].delta.content is not None:
            res_text += chunk.choices[0].delta.content
    return res_text


async def short_image_prompt(user_input: str) -> str:
    """
    리뷰 IMAGE용 간결 프롬프트 보강.
    - 시스템 메시지: shorts_image_message_content
    - 모델: gpt-4o
    - 출력: 약 40–60자의 보강된 영어 프롬프트(설명 없이 본문만)
    """
    res_text = ""
    stream = await client.chat.completions.create(
        model='gpt-4o',
        messages=[
            {"role": "system", "content": shorts_image_message_content},
            {"role": "user", "content": user_input},
        ],
        max_tokens=256,
        stream=True,
    )
    async for chunk in stream:
        if chunk.choices[0].delta.content is not None:
            res_text += chunk.choices[0].delta.content
    return res_text

