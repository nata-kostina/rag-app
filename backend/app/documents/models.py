from __future__ import annotations

import uuid

from sqlalchemy import UUID, Enum, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.document_database import Base, TimestampMixin
from app.documents.schemas import DocumentStatus


class DocumentRecord(TimestampMixin, Base):
    __tablename__ = "documents"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True)
    user_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), nullable=False, index=True)
    original_filename: Mapped[str] = mapped_column(String(255), nullable=False)
    file_path: Mapped[str] = mapped_column(Text, nullable=False)
    status: Mapped[DocumentStatus] = mapped_column(Enum(DocumentStatus, native_enum=False, length=20), nullable=False)
    error_message: Mapped[str | None] = mapped_column(Text, nullable=True)
