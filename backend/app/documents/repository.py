from typing import Any
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.documents.models import DocumentRecord
from app.documents.schemas import DocumentStatus


class DocumentRepository:
    def __init__(self, session: AsyncSession) -> None:
        self.session = session

    async def get_documents(self, user_id: UUID, document_ids: list[UUID] | None = None) -> list[DocumentRecord]:
        stmt = (
            select(DocumentRecord).where(DocumentRecord.user_id == user_id).order_by(DocumentRecord.created_at.desc())
        )

        if document_ids:
            stmt = stmt.where(DocumentRecord.id.in_(document_ids))

        result = await self.session.execute(stmt)

        return list(result.scalars().all())

    async def create_processing_document(
        self, *, id: UUID, user_id: UUID, original_filename: str, file_path: str
    ) -> DocumentRecord:
        record = DocumentRecord(
            id=id,
            user_id=user_id,
            original_filename=original_filename,
            file_path=file_path,
            status=DocumentStatus.PROCESSING,
            error_message=None,
        )
        await self._commit(record)
        return record

    async def upsert(self, *, id: UUID, **kwargs: Any) -> DocumentRecord:
        record = await self.session.get(DocumentRecord, id)
        if record is None:
            record = DocumentRecord(id=id, **kwargs)
        else:
            for field, value in kwargs.items():
                if hasattr(record, field):
                    setattr(record, field, value)

        self.session.add(record)
        await self._commit(record)
        return record

    async def _commit(self, record: DocumentRecord) -> None:
        self.session.add(record)
        await self.session.commit()
        await self.session.refresh(record)
