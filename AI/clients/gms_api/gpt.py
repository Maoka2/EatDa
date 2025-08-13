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
1. Write in natural, descriptive English (1–3 short paragraphs, ~60–100 words).
2. Be specific about subject, environment, composition, style, mood, lighting, color, camera, motion, 	and key visual elements.
3. If the user includes character or style, keep them exactly as-is and use them.
4. Prefer cinematic, concrete visuals over abstract adjectives. Avoid long lists.
5. Don’t invent protected brands/IP unless explicitly provided.
6. Use sensible defaults without asking follow-ups. Never asking follow-ups

작성 가이드 (내부 체크리스트)
1. Subject: who/what, posture, wardrobe or design cues
2.Environment: place, era, weather, time of day, set dressing
3.Extra: on-frame text (quoted), magazine/poster/cover framing if requested

변환 규칙
1. If user input is very short (e.g., “cyberpunk fashion magazine”), expand it fully using defaults.
2. Keep technical parameters out of the prose; prose should feel like a natural director’s brief.

Do not ask any follow-up questions under any circumstances; proceed with sensible defaults.
"""

gen4_system_message_content = '''
역할
Convert a short user idea and (optionally) an input image into a single-scene, action-focused prompt tailored for Gen-4.
Emphasize what moves and how; treat the image as the visual starting point and the text as the motion description.

핵심 원칙
1. Write in natural, descriptive English (1–3 short paragraphs, ~60–100 words).
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
4. Do not ask any follow-up questions under any circumstances; proceed with sensible defaults.
'''


# 이벤트 이미지 전용 시스템 메시지
menuboard_system_message_content = """
역할
Expand a user’s short idea into a concise English prompt optimized for DALL·E 3 that can generate an image of a store menu board.

핵심 원칙
1. Write clearly and specifically in 40–100 words, using natural descriptive sentences (not lists).
2. Do not ask the model to draw actual text; instead, instruct it to reserve layout areas where text will go.
3. Briefly include the color palette, mood, style (e.g., modern, minimal, cute, luxurious), and the primary subject (e.g., coffee, bread, desserts).
4. Always emphasize a menu-board-appropriate composition and visual flow (large title area, secondary text area, a clear focal point, etc.).
5. Ensure the image depicts a menu board and maintains that look. Even if the user doesn’t say “menu board,” the output should always look like one.

출력 형식
Output only the expanded English prompt body. No additional explanations.
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

