"""
GPT 서비스
GPT를 사용한 프롬프트 개선을 담당합니다.
"""

import os
import sys

# 경로 안전장치: /app(루트) 또는 /app/AI 모두 PYTHONPATH에 주입
_CUR = os.path.abspath(os.path.dirname(__file__))
_ROOT_FLAT = os.path.abspath(os.path.join(_CUR, ".."))           # /app
_ROOT_REPO = os.path.abspath(os.path.join(_CUR, "..", ".."))     # /app/AI
for p in (_ROOT_FLAT, _ROOT_REPO):
    if p not in sys.path:
        sys.path.insert(0, p)

try:
    from AI.clients.gms_api.gpt import (
        generate_luma_prompt,
        generate_gen4_prompt,
        generate_menuboard_prompt,
        short_image_prompt,
    )
except ModuleNotFoundError:
    from ai.clients.gms_api.gpt import (  # 폴더명이 ai인 환경 대비
        generate_luma_prompt,
        generate_gen4_prompt,
        generate_menuboard_prompt,
        short_image_prompt,
    )



class GPTService:
    @staticmethod
    async def enhance_prompt(original_prompt: str) -> str:
        """
        기본 프롬프트 개선 (하위호환용): Luma(ray-2) 최적화 규칙 사용
        """
        return await generate_luma_prompt(original_prompt)

    @staticmethod
    async def enhance_prompt_for_luma(original_prompt: str) -> str:
        """Luma(ray-2) 전용 프롬프트 보강"""
        return await generate_luma_prompt(original_prompt)

    @staticmethod
    async def enhance_prompt_for_runway(original_prompt: str) -> str:
        """Runway(Gen-4 Turbo) 전용 프롬프트 보강"""
        return await generate_gen4_prompt(original_prompt)

    @staticmethod
    async def enhance_prompt_for_menuboard(original_prompt: str) -> str:
        """메뉴보드 전용 프롬프트 보강"""
        return await generate_menuboard_prompt(original_prompt)

    @staticmethod
    async def enhance_prompt_for_review_image(original_prompt: str) -> str:
        """리뷰 IMAGE 전용 프롬프트 보강 """
        return await short_image_prompt(original_prompt)


# 전역 인스턴스
gpt_service = GPTService()
