import uuid
from typing import Annotated

from fastapi import APIRouter, Depends, Request, status
from fastapi.responses import StreamingResponse
from fastapi.sse import EventSourceResponse
from sqlalchemy.ext.asyncio import AsyncSession

from app.dependencies import get_session, get_user_id_from_header
from app.queries.repository import QueryRepository
from app.queries.schemas import Query, QueryRequest
from app.services.llm_service import LlmService
from app.services.rag_service import RagService

router = APIRouter(prefix="/api/queries", tags=["queries"])


async def get_query_repository(session: Annotated[AsyncSession, Depends(get_session)]) -> QueryRepository:
    return QueryRepository(session)


@router.get("", response_model=list[Query], status_code=status.HTTP_200_OK)
async def get_queries(
    user_id: Annotated[uuid.UUID, Depends(get_user_id_from_header)],
    repository: Annotated[QueryRepository, Depends(get_query_repository)],
):
    queries = await repository.get_queries(user_id=user_id)
    return queries


@router.post("/stream", status_code=status.HTTP_200_OK)
async def query(
    request: Request,
    body: QueryRequest,
    user_id: Annotated[uuid.UUID, Depends(get_user_id_from_header)],
) -> StreamingResponse:
    query = body.query

    rag_service: RagService = request.app.state.rag_service
    llm_service: LlmService = request.app.state.llm_service

    query_vector = (await rag_service.embed_texts([query]))[0]
    search_result = await rag_service.search(user_id=user_id, query_vector=query_vector)

    context = [result.text for result in search_result]

    system_message, user_message = llm_service.generate_messages(context=context, query=query)

    return EventSourceResponse(
        llm_service.invoke_stream_pipeline(
            query=query,
            user_id=user_id,
            system_message=system_message,
            user_message=user_message,
            search_result=search_result,
        )
    )
