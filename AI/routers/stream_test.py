"""
테스트 전용: Postman/HTTP로 Redis Stream에 메시지를 발행(XADD)하는 엔드포인트
실서비스에서는 비활성/보호 필요
"""

from __future__ import annotations

import os
import json
from typing import Dict, Any

from fastapi import APIRouter, HTTPException
from dotenv import load_dotenv

try:
    from redis import asyncio as redis
except Exception as e:  # pragma: no cover
    raise RuntimeError("redis 패키지가 필요합니다. requirements.txt에 redis>=5 를 설치하세요.") from e

from models.review_generate_models import GenerateRequest
from models.event_image_models import EventAssetGenerateMessage
from models.menuboard_generate_models import MenuPosterGenerateMessage

load_dotenv()

router = APIRouter(prefix="/api/test/stream", tags=["stream-test"], include_in_schema=True)

async def _xadd_payload(stream_key: str, model_obj: Any) -> Dict[str, Any]:
    redis_url = os.getenv("REDIS_URL", "redis://redis:6379/0")
    client: redis.Redis = redis.from_url(redis_url, decode_responses=True)
    try:
        message_id = await client.xadd(stream_key, {"payload": model_obj.model_dump_json()})
        return {"stream": stream_key, "messageId": message_id}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"XADD 실패: {e}")

@router.post("/review-asset")
async def publish_review_asset(req: GenerateRequest):
    stream_key = os.getenv("REVIEW_ASSET_STREAM_KEY", "review.asset.generate")
    return await _xadd_payload(stream_key, req)


@router.post("/event-asset")
async def publish_event_asset(req: EventAssetGenerateMessage):
    stream_key = os.getenv("EVENT_ASSET_STREAM_KEY", "event.asset.generate")
    return await _xadd_payload(stream_key, req)


@router.post("/menu-poster")
async def publish_menu_poster(req: MenuPosterGenerateMessage):
    stream_key = os.getenv("MENU_POSTER_STREAM_KEY", "menu.poster.generate")
    return await _xadd_payload(stream_key, req)
