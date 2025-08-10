import os
import base64
import asyncio
from dotenv import load_dotenv
from openai import AsyncOpenAI

load_dotenv()


def _get_required_env(name: str) -> str:
    value = os.environ.get(name)
    if not value:
        raise RuntimeError(f"환경변수 {name} 가 설정되어 있지 않습니다. .env 또는 실행 환경에 키를 설정하세요.")
    return value


async def generate_and_save_image(
    prompt: str,
    *,
    size: str = "1024x1024",
    model: str = "dall-e-3",
    output_path: str = "output.png",
) -> str:
    """
    GMS 프록시를 통해 DALL·E 3 이미지를 생성하고 파일로 저장합니다.

    Returns: 저장된 파일 경로
    """
    api_key = _get_required_env("GMS_API_KEY")
    base_url = os.environ.get("GMS_BASE_URL", "https://gms.ssafy.io/gmsapi/api.openai.com/v1")

    client = AsyncOpenAI(api_key=api_key, base_url=base_url)

    resp = await client.images.generate(model=model, prompt=prompt, size=size)

    image_b64 = resp.data[0].b64_json
    image_bytes = base64.b64decode(image_b64)
    with open(output_path, "wb") as f:
        f.write(image_bytes)
    return output_path


if __name__ == "__main__":
    # 간단 실행: 기본 프롬프트로 생성
    async def _main():
        saved = await generate_and_save_image("A surreal illustration of a cat set against the backdrop of space.")
        print(f"이미지 저장 완료: {saved}")

    asyncio.run(_main())
