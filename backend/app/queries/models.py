import uuid

from sqlalchemy import UUID, Enum, Integer, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.document_database import Base, TimestampMixin
from app.queries.schemas import QueryStatus


class QueryRecord(TimestampMixin, Base):
    __tablename__ = "queries"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True)
    user_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), nullable=False, index=True)
    query: Mapped[str] = mapped_column(Text, nullable=False)
    response: Mapped[str] = mapped_column(Text, nullable=True)
    status: Mapped[QueryStatus] = mapped_column(Enum(QueryStatus, native_enum=False, length=20), nullable=False)
    prompt_tokens: Mapped[int | None] = mapped_column(Integer, nullable=True)
    completion_tokens: Mapped[int | None] = mapped_column(Integer, nullable=True)
    total_tokens: Mapped[int | None] = mapped_column(Integer, nullable=True)
