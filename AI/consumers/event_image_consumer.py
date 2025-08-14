"""
Redis Stream Consumer (이벤트 에셋 생성)

스트림 키: event.asset.generate
"""

from __future__ import annotations

import asyncio
import json
import base64
import uuid
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
from services.google_image_service import google_image_service
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

    def _file_path_to_public_url(self, file_path: str | None) -> str | None:
        try:
            if not file_path or not isinstance(file_path, str):
                return file_path
            prefix = "/home/ubuntu"
            base_url = "https://i13a609.p.ssafy.io"
            if file_path.startswith(prefix):
                suffix = file_path[len(prefix):]
            else:
                suffix = file_path
            if not suffix.startswith("/"):
                suffix = "/" + suffix
            return base_url + suffix
        except Exception:
            return file_path

    def _save_data_url_to_disk(self, asset_url: str | None, user_id: int) -> str | None:
        try:
            if not asset_url or not isinstance(asset_url, str) or not asset_url.startswith("data:"):
                return asset_url
            # 이벤트 에셋 저장 디렉터리 (요청 사항대로 하드코딩)
            asset_dir = f'/home/ubuntu/eatda/test/data/images/events/{user_id}'
            if not asset_dir:
                return asset_url
            asset_dir = os.path.expanduser(asset_dir)
            header, b64data = asset_url.split(",", 1)
            mime_part = header.split(";")[0]
            mime = mime_part.split(":", 1)[1] if ":" in mime_part else "image/png"
            ext = (
                "png" if "png" in mime else
                "jpg" if ("jpeg" in mime or "jpg" in mime) else
                "webp" if "webp" in mime else
                "png"
            )
            os.makedirs(asset_dir, exist_ok=True)
            file_name = f"{uuid.uuid4().hex}.{ext}"
            file_path = os.path.join(asset_dir, file_name)
            with open(file_path, "wb") as f:
                f.write(base64.b64decode(b64data))
            # 콜백에는 퍼블릭 URL이 아닌 실제 저장 파일 경로를 전달
            try:
                self.logger.info(f"[이벤트이미지컨슈머] data URL saved to file={file_path}")
            except Exception:
                pass
            return file_path
        except Exception as e:
            try:
                self.logger.warning(f"[이벤트이미지컨슈머] data URL 저장/치환 실패: {e}")
            except Exception:
                pass
            return asset_url

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
        # 최소 1개 이상의 사용자 이미지가 있어야 생성 허용
        try:
            if not req.referenceImages or len(req.referenceImages) < 1:
                self.logger.info(
                    f"[이벤트이미지컨슈머] referenceImages 비어있음 -> 생성 불가: eventAssetId={req.eventAssetId}"
                )
                return "FAIL", None
        except Exception:
            return "FAIL", None
        # 참고 이미지 경로(referenceImages)는 EC2에 저장된 로컬 파일 경로
        if not google_image_service.is_available():
            return "FAIL", None
        # Google GenAI SDK는 동기 API이므로 스레드
        loop = asyncio.get_running_loop()
        url = await loop.run_in_executor(None, google_image_service.generate_image_url, req.prompt, req.referenceImages)
        # data URL이면 디스크에 저장하고 저장 경로로 치환
        url = self._save_data_url_to_disk(url, req.userId)
        # 저장된 파일 경로를 퍼블릭 URL로 변환
        public_url = self._file_path_to_public_url(url)
        return ("SUCCESS" if public_url else "FAIL"), public_url
    

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
            try:
                # 로그에는 data URL 전체를 남기지 않도록 축약 표시 (메뉴보드 동일 처리)
                log_payload = dict(callback_data)
                au = log_payload.get("assetUrl")
                if isinstance(au, str) and au.startswith("data:"):
                    try:
                        header, b64 = au.split(",", 1)
                        log_payload["assetUrl"] = f"{header},<base64 {len(b64)} bytes>"
                    except Exception:
                        log_payload["assetUrl"] = "data:<inline image>"
                self.logger.info(
                    f"[이벤트이미지컨슈머] callback payload: id={message_id}, payload={log_payload}"
                )
            except Exception:
                pass
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


