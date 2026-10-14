from __future__ import annotations

import enum
from datetime import datetime
from typing import TYPE_CHECKING
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field
from pydantic.alias_generators import to_camel

if TYPE_CHECKING:
    pass


class DocumentStatus(enum.StrEnum):
    PROCESSING = "processing"
    FAILED = "failed"
    UPLOADED = "uploaded"


class Document(BaseModel):
    model_config = ConfigDict(
        from_attributes=True,
        alias_generator=to_camel,
        validate_by_name=True,
        validate_by_alias=True,
        str_strip_whitespace=True,
        extra="forbid",
    )

    id: UUID
    user_id: UUID
    original_filename: str = Field(min_length=1, max_length=255, pattern=r"^.+\.(pdf|txt|doc|docx|md)$")
    file_path: str
    status: DocumentStatus
    error_message: str | None
    created_at: datetime
    updated_at: datetime


class DocumentIngestEventData(BaseModel):
    doc_id: UUID
    user_id: UUID
    file_path: str
    original_filename: str


class DocumentResponse(BaseModel):
    model_config = ConfigDict(
        from_attributes=True,
        alias_generator=to_camel,
        validate_by_name=True,
        validate_by_alias=True,
        str_strip_whitespace=True,
    )

    id: UUID
    user_id: UUID
    original_filename: str = Field(min_length=1, max_length=255, pattern=r"^.+\.(pdf|txt|doc|docx|md)$")
    status: DocumentStatus
    error_message: str | None


class SearchDocumentsRequest(BaseModel):
    model_config = ConfigDict(populate_by_name=True, alias_generator=to_camel)
    document_ids: list[UUID] | None = Field(default=None, alias="documentIds")
