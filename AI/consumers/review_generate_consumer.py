"""
Redis Stream Consumer (리뷰 자산 생성)

스트림 키: review.asset.generate

역할:
- Redis Stream에서 메시지를 읽어 타입에 따라 이미지/영상 생성 수행
- IMAGE -> DALL·E 3 (GMS 프록시)
- SHORTS_RAY2 -> Luma ray-2
- SHORTS_GEN_4 -> Runway gen4_turbo
- 성공/실패 여부와 URL을 Spring 콜백으로 전달
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

from models.review_generate_models import GenerateRequest
from services import (
    image_service,
    luma_service,
    runway_service,
    gpt_service,
)
from services.review_generate_callback import review_generate_callback


load_dotenv()


class ReviewGenerateConsumer:
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
        self.stream_key: str = os.getenv("REVIEW_ASSET_STREAM_KEY", "review.asset.generate")
        self.dead_stream: str = os.getenv("REVIEW_ASSET_DEAD_STREAM", "review.asset.dead")

        self.client: redis.Redis = redis.from_url(self.redis_url, decode_responses=True)

    async def ensure_consumer_group(self) -> None:
        # 컨슈머 그룹을 보장: 없으면 생성하고, 있으면 그대로 사용
        try:
            await self.client.xgroup_create(self.stream_key, self.group, id="$", mkstream=True)
            self.logger.info(
                f"[리뷰컨슈머] 컨슈머 그룹 생성: stream={self.stream_key}, group={self.group}"
            )
        except redis.ResponseError as e:
            if "BUSYGROUP" not in str(e):
                raise
            self.logger.debug(
                f"[리뷰컨슈머] 컨슈머 그룹 이미 존재: stream={self.stream_key}, group={self.group}"
            )

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
    def parse_message(cls, fields: Dict[str, str]) -> GenerateRequest:
        data = cls._deserialize_fields(fields)
        return GenerateRequest.model_validate(data)

    async def _send_callback(self, review_asset_id: int, result: str, asset_url: str | None, type_str: str) -> Dict[str, Any]:
        callback_data = {
            "reviewAssetId": review_asset_id,
            "result": result,
            "assetUrl": asset_url,
            "type": type_str,
        }
        return await review_generate_callback.send_callback_to_spring(callback_data)

    async def process_image(self, req: GenerateRequest) -> Tuple[str, str | None]:
        if not image_service.is_available():
            return "FAIL", None
        url = await image_service.generate_image_url(req.prompt)
        return ("SUCCESS" if url else "FAIL"), url

    async def process_luma(self, req: GenerateRequest) -> Tuple[str, str | None]:
        if not luma_service.is_available():
            return "FAIL", None
        detailed = await gpt_service.enhance_prompt_for_luma(req.prompt)
        gen = await luma_service.generate_video(detailed, req.referenceImages, model_name="ray-2")
        wait = await luma_service.wait_for_generation_completion(gen["id"])
        ok = wait["state"] == "completed" and bool(wait.get("asset_url"))
        return ("SUCCESS" if ok else "FAIL"), wait.get("asset_url")

    async def process_runway(self, req: GenerateRequest) -> Tuple[str, str | None]:
        if not runway_service.is_available():
            return "FAIL", None
        detailed = await gpt_service.enhance_prompt_for_runway(req.prompt)
        gen = await runway_service.generate_video(
            enhanced_prompt=detailed,
            reference_images=req.referenceImages,
            model_name="gen4_turbo",
            ratio="720:1280",
            duration_seconds=5,
        )
        wait = await runway_service.wait_for_generation_completion(gen["id"])
        ok = wait["state"] == "completed" and bool(wait.get("asset_url"))
        return ("SUCCESS" if ok else "FAIL"), wait.get("asset_url")

    async def handle_message(self, message_id: str, fields: Dict[str, str]) -> None:
        try:
            # 메시지 처리 시작: 필드 키 목록을 함께 기록
            self.logger.debug(
                f"[리뷰컨슈머] 메시지 처리 시작: id={message_id}, keys={list(fields.keys())}"
            )
            req = self.parse_message(fields)
            t = (req.type or "").upper()

            if t == "IMAGE":
                # 이미지 생성 요청 처리 단계
                self.logger.info(f"[리뷰컨슈머] IMAGE 요청 처리: reviewAssetId={req.reviewAssetId}")
                result, url = await self.process_image(req)
            elif t == "SHORTS_GEN_4":
                # Runway(gen4_turbo) 영상 생성 요청 처리 단계
                self.logger.info(f"[리뷰컨슈머] SHORTS_GEN_4 요청 처리: reviewAssetId={req.reviewAssetId}")
                result, url = await self.process_runway(req)
            else:
                # Luma(ray-2) 영상 생성 요청 처리 단계
                self.logger.info(f"[리뷰컨슈머] SHORTS_RAY2 요청 처리: reviewAssetId={req.reviewAssetId}")
                result, url = await self.process_luma(req)

            await self._send_callback(req.reviewAssetId, result, url, req.type)
            # 메시지 처리 완료 기록
            self.logger.info(
                f"[리뷰컨슈머] 메시지 처리 완료: id={message_id}, 결과={result}, assetUrl={url}"
            )
        except Exception as e:
            # 메시지 처리 중 예외 기록 및 데드 스트림으로 이동
            self.logger.exception(f"[리뷰컨슈머] 메시지 처리 중 오류: id={message_id}, err={e}")
            try:
                payload = json.dumps({"error": str(e), "fields": fields})
            except Exception:
                payload = str({"error": str(e)})
            await self.client.xadd(self.dead_stream, {"payload": payload})
            raise

    async def run_forever(self) -> None:
        # 시작 로그
        self.logger.info(
            f"[리뷰컨슈머] 시작: url={self.redis_url}, group={self.group}, consumer={self.consumer_id}, stream={self.stream_key}"
        )

        # 컨슈머 그룹 준비를 재시도하며 보장 (Redis 미기동/네트워크 오류 대비)
        while True:
            try:
                await self.ensure_consumer_group()
                # 상태 변화 로그: FAILED/INIT -> CONNECTED
                if self._conn_state != "CONNECTED":
                    self.logger.info("[리뷰컨슈머] 컨슈머 그룹 준비 완료")
                self._conn_state = "CONNECTED"
                break
            except Exception as e:
                now = time.time()
                # 상태 변화 또는 주기적으로만 에러 로그 출력
                if self._conn_state != "FAILED" or (now - self._last_fail_log_ts) > self._fail_log_interval_sec:
                    self.logger.exception("[리뷰컨슈머] 컨슈머 그룹 준비 실패, 3초 후 재시도: %s", e)
                    self._last_fail_log_ts = now
                self._conn_state = "FAILED"
                await asyncio.sleep(3)

        # 읽기 루프
        while True:
            try:
                # Redis Stream에서 메시지를 컨슈머 그룹으로 읽어오기
                result = await self.client.xreadgroup(
                    groupname=self.group,
                    consumername=self.consumer_id,
                    streams={self.stream_key: ">"},
                    count=5,
                    block=5000,
                )
                if not result:
                    continue
                total_messages = sum(len(messages) for _, messages in result)
                # 읽어온 메시지 개수 기록
                self.logger.info(
                    f"[리뷰컨슈머] 스트림 수신: stream='{self.stream_key}', 개수={total_messages}"
                )
                for _, messages in result:
                    for message_id, fields in messages:
                        try:
                            # 메시지 개별 처리 및 ACK
                            await self.handle_message(message_id, fields)
                            await self.client.xack(self.stream_key, self.group, message_id)
                            self.logger.debug(f"[리뷰컨슈머] 메시지 ACK 완료: id={message_id}")
                        except Exception:
                            await self.client.xack(self.stream_key, self.group, message_id)
            except Exception as loop_err:
                # 상태 변화 또는 주기적으로만 에러 로그 출력 (예: Redis 연결 끊김 등)
                now = time.time()
                if self._conn_state != "FAILED" or (now - self._last_fail_log_ts) > self._fail_log_interval_sec:
                    self.logger.exception(f"[리뷰컨슈머] 루프 오류: {loop_err}")
                    self._last_fail_log_ts = now
                self._conn_state = "FAILED"
                await asyncio.sleep(2)


async def main() -> None:
    consumer = ReviewGenerateConsumer()
    await consumer.run_forever()


if __name__ == "__main__":
    asyncio.run(main())


