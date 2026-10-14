import asyncio
import re

from openai import AsyncOpenAI, RateLimitError

from app.logging_config import logger
from app.providers.schemas import EmbeddingProvider

MAX_WAIT_SECONDS = 60


class OpenAiEmbeddingProvider(EmbeddingProvider):
    def __init__(
        self,
        *,
        base_url: str,
        api_key: str,
        model: str,
        dimension: int,
        batch_size: int,
        max_batch_retries: int,
    ):
        self._client = AsyncOpenAI(base_url=base_url, api_key=api_key, max_retries=0)
        self._model = model
        self._dimension = dimension
        self._batch_size = batch_size
        self._max_batch_retries = max_batch_retries

    async def embed(self, texts: list[str]) -> list[list[float]]:
        all_embeddings = []

        for i in range(0, len(texts), self._batch_size):
            batch = texts[i : i + self._batch_size]

            batch_success = False
            max_attempts = self._max_batch_retries + 1

            for attempt in range(1, max_attempts + 1):
                try:
                    response = await self._client.embeddings.create(
                        input=batch, model=self._model, dimensions=self._dimension
                    )

                    batch_embeddings = [item.embedding for item in response.data]
                    all_embeddings.extend(batch_embeddings)

                    batch_success = True
                    break

                except RateLimitError as e:
                    logger.error(str(e))

                    delay = None

                    try:
                        error_data = getattr(e, "body", None) or getattr(e, "response", None)

                        if isinstance(error_data, dict):
                            details = error_data.get("error", {}).get("details", [])
                            for detail in details:
                                if detail.get("@type") == "type.googleapis.com/google.rpc.RetryInfo":
                                    raw_delay = detail.get("retryDelay", "")  # "26130s"
                                    delay = int(float(raw_delay.rstrip("s")))
                                    break
                    except Exception:
                        pass

                    if delay is None:
                        delay_match = re.search(r"'retryDelay':\s*'(\d+(?:\.\d+)?)s'", str(e))
                        if delay_match:
                            delay = int(float(delay_match.group(1)))

                    if delay is None:
                        delay = 15

                    if delay > MAX_WAIT_SECONDS:
                        logger.error(
                            f"Rate limit retry delay is too long ({delay}s > {MAX_WAIT_SECONDS}s). "
                            f"Daily quota likely exceeded. Aborting local retries."
                        )
                        raise e

                    if attempt == max_attempts:
                        logger.error(
                            f"Batch {i // self._batch_size} failed after {self._max_batch_retries} local retries."
                        )
                        raise e

                    logger.warning(
                        f"Rate limit 429 on batch {i // self._batch_size}. "
                        f"Local retry {attempt}/{self._max_batch_retries} in {delay}s..."
                    )

                    await asyncio.sleep(delay)

            if batch_success and (i + self._batch_size < len(texts)):
                await asyncio.sleep(5)

        return all_embeddings
