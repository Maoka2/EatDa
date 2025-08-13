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
from services import google_image_service, gpt_service
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
            await self.client.xgroup_create(self.stream_key, self.group, id="$")
            self.logger.info(
                f"[메뉴판 컨슈머] 컨슈머 그룹 생성: stream={self.stream_key}, group={self.group}"
            )
        except redis.ResponseError as e:
            if "BUSYGROUP" not in str(e):
                raise

    @staticmethod
    def _deserialize_fields(fields: Dict[str, str]) -> Dict[str, Any]:
        """스트림 필드를 dict로 변환하고, 필드명/타입을 최신 스키마에 맞게 보정한다."""
        # 1) 기본 역직렬화
        if "payload" in fields:
            try:
                data: Dict[str, Any] = json.loads(fields["payload"])  # 단일 JSON 필드
            except Exception:
                data = dict(fields)
        else:
            data = dict(fields)

        # 2) 필드명 보정 (BE 키 변경 대응)
        # assetId or menuPosterAssetId or menuPostAssetId or menuPosterId -> menuPosterAssetId
        if "menuPosterAssetId" not in data:
            mp_asset_id = data.get("menuPosterAssetId")
            if mp_asset_id is None:
                mp_asset_id = data.get("menuPosterId")
            if mp_asset_id is None:
                mp_asset_id = data.get("assetId")
            if mp_asset_id is None:
                mp_asset_id = data.get("menuPostAssetId")  # 오타 변형 대응(BE 측 키)
            if mp_asset_id is not None:
                try:
                    data["menuPosterAssetId"] = int(mp_asset_id)
                except Exception:
                    data["menuPosterAssetId"] = mp_asset_id

        # retryTime (true/false/1/0) -> retryCount (int)
        if "retryCount" not in data and "retryTime" in data:
            rt = data.get("retryTime")
            if isinstance(rt, str):
                val = rt.strip().lower()
                data["retryCount"] = 1 if val in ("true", "1", "yes") else 0
            else:
                data["retryCount"] = 1 if rt else 0

        # images/imageUrls -> referenceImages
        if "referenceImages" not in data and "images" in data:
            data["referenceImages"] = data.get("images")
        if "referenceImages" not in data and "imageUrls" in data:
            data["referenceImages"] = data.get("imageUrls")

        # menuItems -> menu
        if "menu" not in data and "menuItems" in data:
            data["menu"] = data.get("menuItems")

        # 3) 문자열로 온 복합 필드를 배열로 파싱
        for k in ("menu", "referenceImages"):
            val = data.get(k)
            if isinstance(val, str):
                try:
                    data[k] = json.loads(val)
                except Exception:
                    items = [s.strip() for s in val.split(",") if s.strip()]
                    if items and k == "referenceImages":
                        data[k] = items

        # 4) type 기본값 보정
        if not data.get("type"):
            data["type"] = "IMAGE"

        return data

    @classmethod
    def parse_message(cls, fields: Dict[str, str]) -> MenuPosterGenerateMessage:
        data = cls._deserialize_fields(fields)
        return MenuPosterGenerateMessage.model_validate(data)

    async def process_image(self, req: MenuPosterGenerateMessage) -> Tuple[str, str | None]:
        if not google_image_service.is_available():
            return "FAIL", None
        # 메뉴보드 전용 GPT 보강 후 이미지 생성 (참고 이미지가 있다면 함께 전달)
        enhanced = await gpt_service.enhance_prompt_for_menuboard(req.prompt)
        # 참고 이미지 경로(referenceImages)는 EC2에 저장된 로컬 파일 경로라고 가정하고 그대로 전달
        # google_image_service는 로컬 경로가 실제 존재하는 경우에만 이미지를 contents에 포함함
        url = google_image_service.generate_image_url(
            enhanced,
            reference_image_paths=req.referenceImages,
        )
        return ("SUCCESS" if url else "FAIL"), url

    async def handle_message(self, message_id: str, fields: Dict[str, str]) -> None:
        try:
            # 원본 수신 로그
            try:
                self.logger.info(f"[메뉴판컨슈머] recv: id={message_id}, rawKeys={list(fields.keys())}, raw={fields}")
            except Exception:
                pass

            # 역직렬화 및 매핑 결과 로그
            pre_data = self._deserialize_fields(fields)
            try:
                self.logger.info(f"[메뉴판컨슈머] deserialized: id={message_id}, keys={list(pre_data.keys())}, data={pre_data}")
            except Exception:
                pass

            # 모델 검증
            try:
                req = MenuPosterGenerateMessage.model_validate(pre_data)
            except Exception as ve:
                self.logger.exception(f"[메뉴판컨슈머] validation error: id={message_id}, data={pre_data}")
                try:
                    payload = json.dumps({"error": str(ve), "fields": fields, "deserialized": pre_data})
                except Exception:
                    payload = str({"error": str(ve)})
                await self.client.xadd(self.dead_stream, {"payload": payload})
                raise

            result, url = await self.process_image(req)
            callback_data = {
                "assetId": req.menuPosterAssetId,
                "result": result,
                "assetUrl": url,
                "type": req.type,
            }
            try:
                self.logger.info(f"[메뉴판컨슈머] callback payload: id={message_id}, payload={callback_data}")
            except Exception:
                pass
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
                    try:
                        mid_list = [m[0] for m in messages]
                        self.logger.info(f"[메뉴판컨슈머] xreadgroup: count={len(messages)}, ids={mid_list}")
                    except Exception:
                        pass
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


