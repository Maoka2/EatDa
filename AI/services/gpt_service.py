"""
GPT 서비스
GPT를 사용한 프롬프트 개선을 담당합니다.
"""

from clients.gms_api.gpt import generate_luma_prompt


class GPTService:
    @staticmethod
    async def enhance_prompt(original_prompt: str) -> str:
        """
        사용자 프롬프트를 GPT로 개선합니다.
        
        Args:
            original_prompt (str): 원본 프롬프트
            
        Returns:
            str: 개선된 프롬프트
        """
        return await generate_luma_prompt(original_prompt)


# 전역 인스턴스
gpt_service = GPTService()
