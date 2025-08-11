"""
Redis Stream Consumer (영수증 OCR 요청)
"""

from __future__ import annotations

import asyncio
import json
import os
import socket
from typing import Dict

from dotenv import load_dotenv

try:
    from redis import asyncio as redis
except Exception as e:  # pragma: no cover
    raise RuntimeError("redis 패키지가 필요합니다. requirements.txt에 redis>=5 를 설치하세요.") from e

from models.receipt_ocr_models import (
    OCRReceiptRequest,
    OCRReceiptCallbackRequest,
)
from services.receipt_ocr_callback import receipt_ocr_callback_service


load_dotenv()


class ReceiptOCRConsumer:
    def __init__(self) -> None:
        self.redis_url: str = os.getenv("REDIS_URL", "redis://localhost:6379/0")
        self.group: str = os.getenv("REDIS_GROUP", "ai-consumers")
        default_consumer = f"ai-{socket.gethostname()}-{os.getpid()}"
        self.consumer_id: str = os.getenv("REDIS_CONSUMER_ID", default_consumer)
        self.stream_key: str = os.getenv("OCR_RECEIPT_STREAM_KEY", "ocr.verification.request")
        self.dead_stream: str = os.getenv("REDIS_DEAD_STREAM", "ocr.verification.dead")

        self.client: redis.Redis = redis.from_url(self.redis_url, decode_responses=True)

    async def ensure_consumer_groups(self) -> None:
        try:
            await self.client.xgroup_create(self.stream_key, self.group, id="$", mkstream=True)
        except redis.ResponseError as e:
            if "BUSYGROUP" not in str(e):
                raise

    @staticmethod
    def parse_message(fields: Dict[str, str]) -> OCRReceiptRequest:
        if "payload" in fields:
            data = json.loads(fields["payload"])  # 단일 JSON 필드
        else:
            data = dict(fields)
        return OCRReceiptRequest.model_validate(data)

    async def process_ocr_receipt(self, msg: OCRReceiptRequest) -> None:
        if not receipt_ocr_callback_service.is_available():
            raise RuntimeError("CLOVA_RECEIPT_* 환경변수가 설정되지 않았습니다.")

        import httpx
        async with httpx.AsyncClient() as http:
            resp = await http.get(str(msg.imageUrl))
            resp.raise_for_status()
            image_data = resp.content

        fmt = receipt_ocr_callback_service.detect_image_format_from_url(str(msg.imageUrl)) or "jpg"
        ocr_json = await receipt_ocr_callback_service.call_clova_receipt(image_data, fmt)
        result, address = receipt_ocr_callback_service.parse_infer_result(ocr_json)

        callback = OCRReceiptCallbackRequest(
            sourceId=msg.sourceId,
            result=result,
            extractedAddress=address,
        )
        await receipt_ocr_callback_service.send_callback(callback)

    async def handle_message(self, stream: str, message_id: str, fields: Dict[str, str]) -> None:
        try:
            if stream == STREAM_KEY_OCR_RECEIPT_REQUEST:
                msg = self.parse_message(fields)
                await self.process_ocr_receipt(msg)
            else:
                await self.client.xadd(self.dead_stream, {"reason": "unknown_stream", "stream": stream, **fields})
        except Exception as e:
            try:
                payload = json.dumps({"error": str(e), "fields": fields})
            except Exception:
                payload = str({"error": str(e)})
            await self.client.xadd(self.dead_stream, {"payload": payload})
            raise

    async def run_forever(self) -> None:
        await self.ensure_consumer_groups()
        print(
            f"[ReceiptOCRConsumer] start: url={self.redis_url}, group={self.group}, consumer={self.consumer_id}, stream={self.stream_key}"
        )
        while True:
            try:
                result = await self.client.xreadgroup(
                    groupname=self.group,
                    consumername=self.consumer_id,
                    streams={self.stream_key: ">"},
                    count=10,
                    block=5000,
                )
                if not result:
                    continue
                for stream, messages in result:
                    for message_id, fields in messages:
                        try:
                            await self.handle_message(stream, message_id, fields)
                            await self.client.xack(stream, self.group, message_id)
                        except Exception:
                            await self.client.xack(stream, self.group, message_id)
            except Exception as loop_err:
                print(f"[ReceiptOCRConsumer] loop error: {loop_err}")
                await asyncio.sleep(2)


async def main() -> None:
    consumer = ReceiptOCRConsumer()
    await consumer.run_forever()


if __name__ == "__main__":
    asyncio.run(main())


