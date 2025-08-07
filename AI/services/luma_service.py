"""
Luma AI 서비스
Luma AI와의 연동을 담당합니다.
"""

import os
import time
from typing import Dict, Any
from lumaai import AsyncLumaAI
from typing import List


class LumaService:
    def __init__(self):
        """Luma AI 클라이언트를 초기화합니다."""
        try:
            api_key = os.getenv("LUMAAI_API_KEY")
            if not api_key:
                print("LUMAAI_API_KEY not found, Luma service will be disabled")
                self.client = None
                return
            
            self.client = AsyncLumaAI(auth_token=api_key)
            print("Successfully initialized Luma AI client")
        except Exception as e:
            print(f"Failed to initialize Luma AI client: {e}")
            self.client = None
    
    def is_available(self) -> bool:
        """Luma AI 클라이언트가 사용 가능한지 확인합니다."""
        return self.client is not None
    
    async def generate_video(self, enhanced_prompt: str, reference_images: list) -> Dict[str, Any]:
        """
        Luma AI로 영상을 생성합니다.
        
        Args:
            enhanced_prompt (str): 개선된 프롬프트
            reference_images (list): 참고 이미지 URL 목록
            
        Returns:
            Dict[str, Any]: 생성 결과 정보
            
        Raises:
            Exception: Luma AI 클라이언트가 없거나 생성 실패 시
        """
        if not self.is_available():
            raise Exception("Luma AI 클라이언트가 초기화되지 않았습니다. API 키를 확인하세요.")
        
        # keyframes 동적 생성 (referenceImages 사용)
        keyframes = {}
        for i, url in enumerate(reference_images):
            keyframes[f"frame{i}"] = {
                "type": "image",
                "url": url
            }
        
        # Luma AI로 영상 생성 요청
        generation = await self.client.generations.create(
            prompt=enhanced_prompt,
            model="ray-2",
            loop=True,
            aspect_ratio="9:16",
            duration="5s",
            keyframes=keyframes
        )
        
        return {
            "id": generation.id,
            "state": generation.state,
            "created_at": time.time()
        }


# 전역 인스턴스
luma_service = LumaService()
