from uuid import UUID

from pydantic import BaseModel, ConfigDict
from pydantic.alias_generators import to_camel

from app.queries.schemas import QueryStatus


class RagSearchResult(BaseModel):
    model_config = ConfigDict(
        alias_generator=to_camel,
        populate_by_name=True,
    )
    id: str
    doc_id: UUID
    original_filename: str
    text: str


class LlmUsage(BaseModel):
    prompt_tokens: int
    completion_tokens: int
    total_tokens: int


class QueryPayload(BaseModel):
    query_id: UUID
    user_id: UUID
    query: str
    response: str
    usage: LlmUsage | None = None
    status: QueryStatus
