from google import genai
from google.genai import types
from PIL import Image
from io import BytesIO
import json

import PIL.Image

image = Image.open(r"C:\Users\SSAFY\Desktop\tendong.jpg")

client = genai.Client(api_key="AIzaSyDXwG0T-pqiiQvhLcghPM8tNBnCcWbjg_8")

# input prompt
text_input = ('Hi, This is a picture of me.'
            'Can you add a llama next to me?',)

try:
    response = client.models.generate_content(
        model="gemini-2.0-flash-preview-image-generation",
        contents=[text_input, image],
        config=types.GenerateContentConfig(
          response_modalities=['TEXT', 'IMAGE']
        )
    )

    print("=== 전체 응답 객체(Repr) ===")
    print(type(response))
    print(response)
    print()

    # 가능하면 dict로 직렬화해 보기
    try:
        if hasattr(response, "to_dict"):
            resp_dict = response.to_dict()
        else:
            resp_dict = {
                "text": getattr(response, "text", None),
                "candidates": [
                    cand.to_dict() if hasattr(cand, "to_dict") else str(cand)
                    for cand in getattr(response, "candidates", [])
                ],
                "prompt_feedback": getattr(response, "prompt_feedback", None),
                "usage_metadata": getattr(response, "usage_metadata", None),
            }
        print("=== 전체 응답 객체(JSON) ===")
        print(json.dumps(resp_dict, ensure_ascii=False, indent=2, default=lambda o: getattr(o, "__dict__", str(o))))
        print()
    except Exception:
        pass

    # 후보와 파트 상세 출력 및 이미지 저장/표시
    candidates = getattr(response, 'candidates', [])
    print(f"=== 응답 후보 개수: {len(candidates)} ===")
    for i, candidate in enumerate(candidates):
        print(f"\n--- Candidate {i} ---")
        print(candidate)
        content = getattr(candidate, 'content', None)
        if content is not None:
            parts = getattr(content, 'parts', [])
            print(f"Parts: {len(parts)}")
            for j, part in enumerate(parts):
                print(f"  Part {j}: {part}")
                if hasattr(part, 'text') and part.text is not None:
                    print(f"  Part {j} Text:\n{part.text}")
                elif hasattr(part, 'inline_data') and part.inline_data is not None:
                    data = part.inline_data.data
                    print(f"  Part {j} Image bytes: {len(data)} bytes")
                    img = Image.open(BytesIO(data))
                    out_name = f"generated_image_{i}_{j}.png"
                    img.save(out_name)
                    print(f"  Part {j} image saved: {out_name}")
                    try:
                        img.show()
                    except Exception:
                        pass

    # 메타데이터 출력
    if hasattr(response, 'usage_metadata'):
        print("\n=== Usage Metadata ===")
        print(getattr(response, 'usage_metadata'))
    if hasattr(response, 'prompt_feedback'):
        print("\n=== Prompt Feedback ===")
        print(getattr(response, 'prompt_feedback'))

except Exception as e:
    print("=== 에러 발생 ===")
    print(type(e))
    print(e)
    # 에러 상세 속성 덤프
    for attr in dir(e):
        if not attr.startswith('_'):
            try:
                print(f"{attr}: {getattr(e, attr)}")
            except Exception:
                print(f"{attr}: [접근 불가]")



from typing import List, Optional, Literal, Any, Dict
from pydantic import BaseModel


class ModalityTokenCount(BaseModel):
    modality: Literal["TEXT", "IMAGE"]
    token_count: int


class UsageMetadata(BaseModel):
    cache_tokens_details: Optional[Any] = None
    cached_content_token_count: Optional[int] = None
    candidates_token_count: Optional[int] = None
    candidates_tokens_details: Optional[List[ModalityTokenCount]] = None
    prompt_token_count: Optional[int] = None
    prompt_tokens_details: Optional[List[ModalityTokenCount]] = None
    thoughts_token_count: Optional[int] = None
    tool_use_prompt_token_count: Optional[int] = None
    tool_use_prompt_tokens_details: Optional[Any] = None
    total_token_count: Optional[int] = None
    traffic_type: Optional[Any] = None


class Blob(BaseModel):
    data: bytes
    mime_type: Optional[str] = None


class Part(BaseModel):
    # 텍스트 파트
    text: Optional[str] = None
    # 이미지 등 바이너리 파트
    inline_data: Optional[Blob] = None

    # 출력에서 보였던 기타 가능 필드들(전부 옵션)
    video_metadata: Optional[Any] = None
    thought: Optional[Any] = None
    file_data: Optional[Any] = None
    thought_signature: Optional[Any] = None
    code_execution_result: Optional[Any] = None
    executable_code: Optional[Any] = None
    function_call: Optional[Any] = None
    function_response: Optional[Any] = None


class Content(BaseModel):
    parts: List[Part]
    role: Optional[Literal["model", "user", "tool"]] = None


class Candidate(BaseModel):
    content: Content
    finish_reason: Optional[Literal["STOP", "MAX_TOKENS", "SAFETY", "OTHER"]] = None
    index: Optional[int] = None

    # 출력에서 None으로 보였던 필드들(옵션)
    citation_metadata: Optional[Any] = None
    finish_message: Optional[Any] = None
    token_count: Optional[int] = None
    url_context_metadata: Optional[Any] = None
    avg_logprobs: Optional[Any] = None
    grounding_metadata: Optional[Any] = None
    logprobs_result: Optional[Any] = None
    safety_ratings: Optional[Any] = None


class HttpResponse(BaseModel):
    headers: Optional[Dict[str, Any]] = None


class GenerateContentResponseModel(BaseModel):
    sdk_http_response: Optional[HttpResponse] = None
    candidates: List[Candidate]
    create_time: Optional[str] = None
    model_version: Optional[str] = None
    prompt_feedback: Optional[Any] = None
    response_id: Optional[str] = None
    usage_metadata: Optional[UsageMetadata] = None
    automatic_function_calling_history: Optional[List[Any]] = None
    parsed: Optional[Any] = None