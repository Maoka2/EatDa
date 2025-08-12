"""
Redis Stream Consumer (메뉴 포스터 생성)

스트림 키: menu.poster.generate
"""

from __future__ import annotations

import asyncio
import json
import os
import socket
from typing import Any, Dict, Tuple
import logging
import time


from dotenv import load_dotenv

try:
    from redis import asyncio as redis
except Exception as e:  # pragma: no cover
    raise RuntimeError("redis 패키지가 필요합니다. requirements.txt에 redis>=5 를 설치하세요.") from e

from models.menuboard_generate_models import (
    MenuPosterGenerateMessage,
)
from services import image_service, gpt_service
from services.menuboard_generate_callback import menuboard_generate_callback_service


load_dotenv()


class MenuboardGenerateConsumer:
    def __init__(self) -> None:
        # 로거 초기화: 이 컨슈머의 실행/에러/처리 상황을 기록
        self.logger = logging.getLogger(__name__)
        # 연결 상태 및 로그 억제 변수 (상태 변화 시에만 강한 로그)
        self._conn_state: str = "INIT"  # INIT | CONNECTED | FAILED
        self._last_fail_log_ts: float = 0.0
        self._fail_log_interval_sec: float = 60.0  # 실패 지속 시 로그 최소 간격
        self.redis_url: str = os.getenv("REDIS_URL", "redis://redis:6379/0")
        self.group: str = os.getenv("REDIS_GROUP", "ai-consumers")
        default_consumer = f"ai-{socket.gethostname()}-{os.getpid()}"
        self.consumer_id: str = os.getenv("REDIS_CONSUMER_ID", default_consumer)
        self.stream_key: str = os.getenv("MENU_POSTER_STREAM_KEY", "menu.poster.generate")
        self.dead_stream: str = os.getenv("MENU_POSTER_DEAD_STREAM", "menu.poster.dead")

        self.client: redis.Redis = redis.from_url(self.redis_url, decode_responses=True)

    async def ensure_consumer_group(self) -> None:
        try:
            await self.client.xgroup_create(self.stream_key, self.group, id="$", mkstream=True)
            self.logger.info(
                f"[메뉴판 컨슈머] 컨슈머 그룹 생성: stream={self.stream_key}, group={self.group}"
            )
        except redis.ResponseError as e:
            if "BUSYGROUP" not in str(e):
                raise

    @staticmethod
    def _deserialize_fields(fields: Dict[str, str]) -> Dict[str, Any]:
        if "payload" in fields:
            data = json.loads(fields["payload"])  # 단일 JSON 필드
        else:
            data = dict(fields)
        for k in ("menu", "referenceImages"):
            val = data.get(k)
            if isinstance(val, str):
                try:
                    data[k] = json.loads(val)
                except Exception:
                    pass
        return data

    @classmethod
    def parse_message(cls, fields: Dict[str, str]) -> MenuPosterGenerateMessage:
        data = cls._deserialize_fields(fields)
        return MenuPosterGenerateMessage.model_validate(data)

    async def process_image(self, req: MenuPosterGenerateMessage) -> Tuple[str, str | None]:
        if not image_service.is_available():
            return "FAIL", None
        # 메뉴보드 전용 GPT 보강 후 이미지 생성
        enhanced = await gpt_service.enhance_prompt_for_menuboard(req.prompt)
        url = await image_service.generate_image_url(enhanced)
        return ("SUCCESS" if url else "FAIL"), url

    async def handle_message(self, message_id: str, fields: Dict[str, str]) -> None:
        try:
            req = self.parse_message(fields)
            result, url = await self.process_image(req)
            callback_data = {
                "menuPosterAssetId": req.menuPosterAssetId,
                "result": result,
                "assetUrl": url,
                "type": req.type,
            }
            await menuboard_generate_callback_service.send_callback_to_spring(callback_data)
        except Exception as e:
            try:
                payload = json.dumps({"error": str(e), "fields": fields})
            except Exception:
                payload = str({"error": str(e)})
            await self.client.xadd(self.dead_stream, {"payload": payload})
            raise

    async def run_forever(self) -> None:
        # 컨슈머 그룹 준비를 재시도하며 보장 (Redis 미기동/네트워크 오류 대비)
        while True:
            try:
                await self.ensure_consumer_group()
                print("[메뉴판컨슈머] consumer group ready")
                break
            except Exception as e:
                print(f"[메뉴판컨슈머] failed to prepare consumer group, retry in 3s: {e}")
                await asyncio.sleep(3)

        print(
            f"[메뉴판컨슈머] start: url={self.redis_url}, group={self.group}, consumer={self.consumer_id}, stream={self.stream_key}"
        )
        while True:
            try:
                result = await self.client.xreadgroup(
                    groupname=self.group,
                    consumername=self.consumer_id,
                    streams={self.stream_key: ">"},
                    count=5,
                    block=5000,
                )
                if not result:
                    continue
                for _, messages in result:
                    for message_id, fields in messages:
                        try:
                            await self.handle_message(message_id, fields)
                            await self.client.xack(self.stream_key, self.group, message_id)
                        except Exception as handle_err:
                            print(f"[메뉴판컨슈머] handle_message error: {handle_err}")
                            await self.client.xack(self.stream_key, self.group, message_id)
            except Exception as loop_err:
                print(f"[메뉴판컨슈머] loop error: {loop_err}")
                await asyncio.sleep(2)


async def main() -> None:
    consumer = MenuboardGenerateConsumer()
    await consumer.run_forever()


if __name__ == "__main__":
    asyncio.run(main())


