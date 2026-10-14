import json
import re
import uuid
from collections.abc import AsyncGenerator
from typing import Any

import inngest

from app.inngest.inngest_client import InngestClient
from app.logging_config import logger
from app.providers.schemas import LLMProvider
from app.queries.schemas import Query
from app.services.schemas import LlmUsage, QueryStatus, RagSearchResult

NO_CONTEXT_MARKER = "NO_CONTEXT_FOUND"

SYSTEM_MESSAGE = f"""You are a helpful assistant. Answer questions using ONLY the provided context.
If the context does not contain enough information to answer the question, respond with exactly:
"{NO_CONTEXT_MARKER}: I don't have enough information in the provided context to answer this question."
Do not attempt to use outside knowledge.
"""

NO_CONTEXT_PATTERN = re.compile(r"NO_CONTEXT_FOUND|no context|provided context, there is no", re.IGNORECASE)

class LlmService:
    def __init__(self, llm_provider: LLMProvider):
        self._provider = llm_provider

    def generate_messages(self, context: list[str], query: str) -> tuple[str, str]:
        context_block = "\n\n".join(f"- {c}" for c in context)
        user_message = (
            "Use the following context to answer the question.\n\n"
            f"Context: \n{context_block}\n\n"
            f"Question: {query}\n"
            "Answer concisely using the context above."
        )

        return SYSTEM_MESSAGE, user_message

    async def invoke_stream_pipeline(
        self,
        *,
        query: str,
        system_message: str,
        user_message: str,
        user_id: uuid.UUID,
        search_result: list[RagSearchResult],
    ) -> AsyncGenerator[str, Any]:
        query_id = uuid.uuid4()
        inngest_client = InngestClient.get_client()

        try:


            full_response_text = ""
            last_usage: LlmUsage | None = None

            async for content, usage in self._provider.stream_response(
                user_message=user_message, system_message=system_message
            ):
                if content:
                    full_response_text += content
                    yield f"event: message\ndata: {json.dumps(content)}\n\n"
                if usage:
                    last_usage = LlmUsage(
                        prompt_tokens=usage.prompt_tokens,
                        completion_tokens=usage.completion_tokens,
                        total_tokens=usage.total_tokens,
                    )

            if NO_CONTEXT_PATTERN.search(full_response_text):
                yield "event: citations\ndata: []\n\n"
            else:
                citations_data = json.dumps([item.model_dump(mode="json", by_alias=True) for item in search_result])
                yield f"event: citations\ndata: {citations_data}\n\n"
            
            yield 'event: done\ndata: "done"\n\n'

            await inngest_client.send(
                inngest.Event(
                    name="query/message.completed",
                    data=Query(
                        id=query_id,
                        user_id=user_id,
                        query=query,
                        response=full_response_text,
                        status=QueryStatus.SUCCESS,
                        total_tokens=last_usage.total_tokens if last_usage else None,
                        completion_tokens=last_usage.completion_tokens if last_usage else None,
                        prompt_tokens=last_usage.prompt_tokens if last_usage else None,
                    ).model_dump(mode="json"),
                )
            )

        except Exception as error:
            logger.error(error)
            logger.exception(f"Error while processing chat stream for user {user_id}")
            error_payload = json.dumps({
                "error": True,
                "message": "An error occurred while generating the response. Please try again later."
            })

            yield f"event: error\ndata: {error_payload}\n\n"

            await inngest_client.send(
                inngest.Event(
                    name="query/message.completed",
                    data=Query(
                        id=query_id,
                        user_id=user_id,
                        query=query,
                        status=QueryStatus.ERROR,
                    ).model_dump(mode="json"),
                )
            )
