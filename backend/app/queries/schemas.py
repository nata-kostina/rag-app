import enum
from uuid import UUID

from pydantic import BaseModel, ConfigDict
from pydantic.alias_generators import to_camel


class QueryStatus(enum.StrEnum):
    SUCCESS = "success"
    ERROR = "error"


class Query(BaseModel):
    model_config = ConfigDict(
        from_attributes=True,
        alias_generator=to_camel,
        validate_by_name=True,
        validate_by_alias=True,
        str_strip_whitespace=True,
    )
    
    id: UUID
    user_id: UUID
    query: str
    response: str | None = None
    status: QueryStatus
    prompt_tokens: int | None = None
    completion_tokens: int | None = None
    total_tokens: int | None = None


class QueryRequest(BaseModel):
    query: str
