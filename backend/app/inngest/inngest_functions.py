import uuid
from pathlib import Path
from typing import Any

import inngest

from app.documents.repository import DocumentRepository
from app.documents.schemas import (
    Document,
    DocumentIngestEventData,
    DocumentResponse,
    DocumentStatus,
)
from app.inngest.inngest_client import InngestClient
from app.inngest.inngest_middleware import get_rag_service, get_session_maker
from app.queries.repository import QueryRepository
from app.queries.schemas import Query

inngest_client = InngestClient.get_client()

PROJECT_DIR = Path(__file__).parents[2]


async def handle_ingest_failure(ctx: inngest.Context) -> dict[str, Any] | str:
    error = ctx.event.data.get("error", {})
    error_message = error.get("message", "Server error.") if isinstance(error, dict) else ""

    original_event = ctx.event.data.get("event", {})
    data = original_event.get("data", {}) if isinstance(original_event, dict) else {}
    doc_id = data.get("doc_id", None) if isinstance(data, dict) else None

    session_factory = get_session_maker(ctx)

    if isinstance(doc_id, str):
        async with session_factory() as session:
            repository = DocumentRepository(session)
            document = await repository.upsert(
                id=uuid.UUID(doc_id), status=DocumentStatus.FAILED, error_message=error_message
            )
            return Document.model_validate(document).model_dump(mode="json")

    return f"Document not found, doc_id: {doc_id}"


@inngest_client.create_function(
    fn_id="Document: Ingest",
    trigger=inngest.TriggerEvent(event="document/ingest.requested"),
    on_failure=handle_ingest_failure,
    retries=0,
)
async def ingest_document(ctx: inngest.Context) -> dict[str, Any]:
    rag_service = get_rag_service(ctx)
    session_factory = get_session_maker(ctx)

    data = DocumentIngestEventData.model_validate(ctx.event.data)
    file_path = data.file_path
    doc_id = data.doc_id
    user_id = data.user_id
    original_filename = data.original_filename

    async def _load_and_chunk(file_path: Path) -> list[str]:
        texts = await rag_service.load_document(file_path)
        chunks = await rag_service.split_document(texts)
        return chunks

    async def _embed_and_save(chunks: list[str]) -> int:
        embeddings = await rag_service.embed_texts(chunks)
        num_embedded = await rag_service.save_embeddings(
            chunks=chunks, doc_id=doc_id, embeddings=embeddings, user_id=user_id, original_filename=original_filename
        )
        return num_embedded

    async def _update_document_status() -> dict[str, Any]:
        async with session_factory() as session:
            repository = DocumentRepository(session)
            document = await repository.upsert(id=doc_id, status=DocumentStatus.UPLOADED)
            return DocumentResponse.model_validate(document).model_dump(mode="json")

    chunks = await ctx.step.run("load-and-chunk-document", lambda: _load_and_chunk(file_path=PROJECT_DIR / file_path))
    num_embedded = await ctx.step.run("embed-and-save-vectors", lambda: _embed_and_save(chunks))
    document = await ctx.step.run("update-document-status", lambda: _update_document_status())

    return {"document": document, "num_embedded": num_embedded, "chunks": chunks}


@inngest_client.create_function(
    fn_id="Query: Save result", trigger=inngest.TriggerEvent(event="query/message.completed"), retries=2
)
async def save_query(ctx: inngest.Context) -> dict[str, Any]:
    session_factory = get_session_maker(ctx)

    data = Query.model_validate(ctx.event.data)

    async def _save_query_result() -> dict[str, Any]:
        async with session_factory() as session:
            repository = QueryRepository(session)
            query_record = await repository.create_record(**(data.model_dump()))
            return Query.model_validate(query_record).model_dump(mode="json")

    query_record = await ctx.step.run("save-query-result", _save_query_result)
    return query_record
