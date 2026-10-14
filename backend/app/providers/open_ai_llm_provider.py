from collections.abc import AsyncGenerator
from typing import Any

from openai import AsyncOpenAI
from openai.types import CompletionUsage
from openai.types.chat import ChatCompletionMessageParam

from app.providers.schemas import LLMProvider


class OpenAiLlmProvider(LLMProvider):
    def __init__(self, *, base_url: str, api_key: str, model: str, temperature: float, max_tokens: int = 1024):
        self._client = AsyncOpenAI(base_url=base_url, api_key=api_key, max_retries=0)
        self._model = model
        self._temperature = temperature
        self._max_tokens = max_tokens

    def _build_request_params(self, system_message: str, user_message: str) -> dict:
        messages: list[ChatCompletionMessageParam] = [
            {"role": "system", "content": system_message},
            {"role": "user", "content": user_message},
        ]
        params = {
            "model": self._model,
            "temperature": self._temperature,
            "messages": messages,
            "max_tokens": self._max_tokens,
        }

        return params

    async def create_response(self, *, system_message: str, user_message: str) -> str:
        params = self._build_request_params(system_message, user_message)

        response = await self._client.chat.completions.create(**params)
        return response.choices[0].message.content or ""

    async def stream_response(
        self, *, system_message: str, user_message: str
    ) -> AsyncGenerator[tuple[str | None, CompletionUsage | None], Any]:
        params = self._build_request_params(system_message, user_message)

        response = await self._client.chat.completions.create(
            stream=True, stream_options={"include_usage": True}, **params
        )

        async for chunk in response:
            if chunk.choices and len(chunk.choices):
                content = chunk.choices[0].delta.content
                usage = chunk.usage
                if content or usage:
                    yield content, usage
