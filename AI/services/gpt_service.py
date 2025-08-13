"""
GPT 서비스
GPT를 사용한 프롬프트 개선을 담당합니다.
"""

from clients.gms_api.gpt import (
    generate_luma_prompt,
    generate_gen4_prompt,
    generate_menuboard_prompt,
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


# 전역 인스턴스
gpt_service = GPTService()
