import base64
import logging
from io import BytesIO
from typing import Optional

logger = logging.getLogger(__name__)

PROMPT = "Extract all text from this image accurately. Preserve the original formatting including paragraphs, lists, and tables. Return only the extracted text."

async def get_ocr_result(image_bytes: bytes, provider: str, api_key: str, model: Optional[str] = None) -> str:
    if provider == "openai":
        return await _ocr_openai(image_bytes, api_key, model or "gpt-4o")
    elif provider == "claude":
        return await _ocr_claude(image_bytes, api_key, model or "claude-3-5-sonnet-20241022")
    elif provider == "gemini":
        return await _ocr_gemini(image_bytes, api_key, model or "gemini-1.5-pro")
    elif provider == "grok":
        return await _ocr_grok(image_bytes, api_key, model or "grok-2-vision-1212")
    else:
        raise ValueError(f"Unknown provider: {provider}")

async def _ocr_openai(image_bytes: bytes, api_key: str, model: str) -> str:
    from openai import AsyncOpenAI
    client = AsyncOpenAI(api_key=api_key)
    b64 = base64.b64encode(image_bytes).decode()
    response = await client.chat.completions.create(
        model=model,
        messages=[{
            "role": "user",
            "content": [
                {"type": "image_url", "image_url": {"url": f"data:image/png;base64,{b64}"}},
                {"type": "text", "text": PROMPT},
            ],
        }],
        max_tokens=4096,
    )
    return response.choices[0].message.content or ""

async def _ocr_claude(image_bytes: bytes, api_key: str, model: str) -> str:
    import anthropic
    client = anthropic.AsyncAnthropic(api_key=api_key)
    b64 = base64.b64encode(image_bytes).decode()
    response = await client.messages.create(
        model=model,
        max_tokens=4096,
        messages=[{
            "role": "user",
            "content": [
                {"type": "image", "source": {"type": "base64", "media_type": "image/png", "data": b64}},
                {"type": "text", "text": PROMPT},
            ],
        }],
    )
    return response.content[0].text if response.content else ""

async def _ocr_gemini(image_bytes: bytes, api_key: str, model: str) -> str:
    import google.generativeai as genai
    from PIL import Image
    genai.configure(api_key=api_key)
    gemini_model = genai.GenerativeModel(model)
    img = Image.open(BytesIO(image_bytes))
    response = await gemini_model.generate_content_async([PROMPT, img])
    return response.text or ""

async def _ocr_grok(image_bytes: bytes, api_key: str, model: str) -> str:
    from openai import AsyncOpenAI
    client = AsyncOpenAI(api_key=api_key, base_url="https://api.x.ai/v1")
    b64 = base64.b64encode(image_bytes).decode()
    response = await client.chat.completions.create(
        model=model,
        messages=[{
            "role": "user",
            "content": [
                {"type": "image_url", "image_url": {"url": f"data:image/png;base64,{b64}"}},
                {"type": "text", "text": PROMPT},
            ],
        }],
        max_tokens=4096,
    )
    return response.choices[0].message.content or ""
