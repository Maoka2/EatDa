"""
Redis Stream Consumer (이벤트 에셋 생성)

스트림 키: event.asset.generate
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

from models.event_image_models import EventAssetGenerateMessage
from services import image_service
from services.event_image_callback import event_image_callback_service


load_dotenv()

class EventImageConsumer:
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
        self.stream_key: str = os.getenv("EVENT_ASSET_STREAM_KEY", "event.asset.generate")
        self.dead_stream: str = os.getenv("EVENT_ASSET_DEAD_STREAM", "event.asset.dead")

        self.client: redis.Redis = redis.from_url(self.redis_url, decode_responses=True)

    async def ensure_consumer_group(self) -> None:
        try:
            await self.client.xgroup_create(self.stream_key, self.group, id="$")
        except redis.ResponseError as e:
            if "BUSYGROUP" not in str(e):
                raise
            self.logger.debug(
                f"[이벤트이미지컨슈머] 컨슈머 그룹 이미 존재: stream={self.stream_key}, group={self.group}"
            )

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
        # assetId -> eventAssetId
        if "eventAssetId" not in data:
            asset_id = data.get("assetId")
            if asset_id is not None:
                try:
                    data["eventAssetId"] = int(asset_id)
                except Exception:
                    data["eventAssetId"] = asset_id

        # retryTime (true/false/1/0) -> retryCount (int)
        if "retryCount" not in data and "retryTime" in data:
            rt = data.get("retryTime")
            if isinstance(rt, str):
                val = rt.strip().lower()
                data["retryCount"] = 1 if val in ("true", "1", "yes") else 0
            else:
                data["retryCount"] = 1 if rt else 0

        # images -> referenceImages
        if "referenceImages" not in data and "images" in data:
            data["referenceImages"] = data.get("images")

        # 3) 문자열로 온 referenceImages를 배열로 파싱
        ref_val = data.get("referenceImages")
        if isinstance(ref_val, str):
            try:
                parsed = json.loads(ref_val)
                if isinstance(parsed, list):
                    data["referenceImages"] = parsed
            except Exception:
                items = [s.strip() for s in ref_val.split(",") if s.strip()]
                if items:
                    data["referenceImages"] = items

        return data

    @classmethod
    def parse_message(cls, fields: Dict[str, str]) -> EventAssetGenerateMessage:
        data = cls._deserialize_fields(fields)
        return EventAssetGenerateMessage.model_validate(data)

    async def process_image(self, req: EventAssetGenerateMessage) -> Tuple[str, str | None]:
        if not image_service.is_available():
            return "FAIL", None
        url = await image_service.generate_image_url(req.prompt)
        return ("SUCCESS" if url else "FAIL"), url
    

    async def handle_message(self, message_id: str, fields: Dict[str, str]) -> None:
        try:
            # 원본 수신 로그
            try:
                self.logger.info(
                    f"[이벤트이미지컨슈머] recv: id={message_id}, rawKeys={list(fields.keys())}, raw={fields}"
                )
            except Exception:
                pass

            # 역직렬화 및 매핑 결과 로그
            pre_data = self._deserialize_fields(fields)
            try:
                self.logger.info(
                    f"[이벤트이미지컨슈머] deserialized: id={message_id}, keys={list(pre_data.keys())}, data={pre_data}"
                )
            except Exception:
                pass

            # 모델 검증
            try:
                req = EventAssetGenerateMessage.model_validate(pre_data)
            except Exception as ve:
                self.logger.exception(
                    f"[이벤트이미지컨슈머] validation error: id={message_id}, data={pre_data}"
                )
                try:
                    payload = json.dumps({"error": str(ve), "fields": fields, "deserialized": pre_data})
                except Exception:
                    payload = str({"error": str(ve)})
                await self.client.xadd(self.dead_stream, {"payload": payload})
                raise
            result, url = await self.process_image(req)

            callback_data = {
                "assetId": req.eventAssetId,
                "result": result,
                "assetUrl": url,
                "type": "IMAGE",
            }
            self.logger.info(
                f"[이벤트이미지컨슈머] callback payload: id={message_id}, payload={callback_data}"
            )
            await event_image_callback_service.send_callback_to_spring(callback_data)
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
                print("[이벤트이미지컨슈머] consumer group ready")
                break
            except Exception as e:
                print(f"[이벤트이미지컨슈머] failed to prepare consumer group, retry in 3s: {e}")
                await asyncio.sleep(3)

        print(
            f"[이벤트이미지컨슈머] start: url={self.redis_url}, group={self.group}, consumer={self.consumer_id}, stream={self.stream_key}"
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
                        self.logger.info(
                            f"[이벤트이미지컨슈머] xreadgroup: count={len(messages)}, ids={mid_list}"
                        )
                    except Exception:
                        pass
                    for message_id, fields in messages:
                        try:
                            await self.handle_message(message_id, fields)
                            await self.client.xack(self.stream_key, self.group, message_id)
                        except Exception as handle_err:
                            print(f"[이벤트이미지컨슈머] handle_message error: {handle_err}")
                            await self.client.xack(self.stream_key, self.group, message_id)
            except Exception as loop_err:
                print(f"[이벤트이미지컨슈머] loop error: {loop_err}")
                await asyncio.sleep(2)


async def main() -> None:
    consumer = EventImageConsumer()
    await consumer.run_forever()


if __name__ == "__main__":
    asyncio.run(main())


