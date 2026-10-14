from abc import ABC, abstractmethod
from collections.abc import AsyncGenerator
from typing import Any

from openai.types import CompletionUsage


class EmbeddingProvider(ABC):
    @abstractmethod
    async def embed(self, texts: list[str]) -> list[list[float]]: ...


class LLMProvider(ABC):
    @abstractmethod
    async def create_response(self, *, system_message: str, user_message: str) -> str: ...

    @abstractmethod
    def stream_response(
        self, *, system_message: str, user_message: str
    ) -> AsyncGenerator[tuple[str|None, CompletionUsage|None], Any]: ...
