from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.queries.models import QueryRecord
from app.queries.schemas import QueryStatus


class QueryRepository:
    def __init__(self, session: AsyncSession) -> None:
        self.session = session

    async def get_queries(self, *, user_id: UUID) -> list[QueryRecord]:
        stmt = (
            select(QueryRecord)
            .where(QueryRecord.user_id == user_id)
            .order_by(QueryRecord.created_at.desc())
        )

        result = await self.session.scalars(stmt)

        return list(result.all())

    async def create_record(
        self,
        *,
        id: UUID,
        user_id: UUID,
        query: str,
        response: str,
        status: QueryStatus,
        prompt_tokens: int | None,
        completion_tokens: int | None,
        total_tokens: int | None,
    ) -> QueryRecord:
        record = QueryRecord(
            id=id,
            user_id=user_id,
            query=query,
            response=response,
            status=status,
            prompt_tokens=prompt_tokens,
            completion_tokens=completion_tokens,
            total_tokens=total_tokens,
        )
        await self._commit(record)
        return record

    async def _commit(self, record: QueryRecord) -> None:
        self.session.add(record)
        await self.session.commit()
        await self.session.refresh(record)
