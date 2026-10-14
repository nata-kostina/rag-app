import uuid
from typing import Annotated

import inngest
from fastapi import APIRouter, Depends, File, Form, UploadFile, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import get_settings
from app.dependencies import get_session, get_user_id_from_header
from app.documents.models import DocumentRecord
from app.documents.repository import DocumentRepository
from app.documents.schemas import DocumentIngestEventData, DocumentResponse, SearchDocumentsRequest
from app.documents.service import DocumentService
from app.inngest.inngest_client import InngestClient

router = APIRouter(prefix="/api/documents", tags=["documents"])


async def get_document_repository(session: Annotated[AsyncSession, Depends(get_session)]) -> DocumentRepository:
    return DocumentRepository(session)


def build_document_service(repository: DocumentRepository) -> DocumentService:
    settings = get_settings()
    return DocumentService(
        repository=repository,
        upload_dir=settings.upload_dir,
        allowed_mime_types=settings.allowed_mime_types,
        allowed_extensions=settings.allowed_extensions,
    )


@router.post("/upload", response_model=DocumentResponse, status_code=status.HTTP_201_CREATED)
async def upload_document(
    file: Annotated[UploadFile, File()],
    doc_id: Annotated[uuid.UUID, Form(alias="docId")],
    user_id: Annotated[uuid.UUID, Depends(get_user_id_from_header)],
    repository: Annotated[DocumentRepository, Depends(get_document_repository)],
) -> DocumentRecord:
    service = build_document_service(repository)
    document = await service.upload_document(doc_id=doc_id, user_id=user_id, file=file)

    inngest_client = InngestClient.get_client()

    await inngest_client.send(
        inngest.Event(
            name="document/ingest.requested",
            data=DocumentIngestEventData(
                doc_id=document.id,
                user_id=document.user_id,
                file_path=document.file_path,
                original_filename=document.original_filename,
            ).model_dump(mode="json"),
        )
    )
    return document


@router.get("", response_model=list[DocumentResponse], status_code=status.HTTP_200_OK)
async def get_documents(
    user_id: Annotated[uuid.UUID, Depends(get_user_id_from_header)],
    repository: Annotated[DocumentRepository, Depends(get_document_repository)],
) -> list[DocumentRecord]:
    documents = await repository.get_documents(user_id)
    return documents


@router.post("/search", response_model=list[DocumentResponse], status_code=status.HTTP_200_OK)
async def search_documents(
    user_id: Annotated[uuid.UUID, Depends(get_user_id_from_header)],
    repository: Annotated[DocumentRepository, Depends(get_document_repository)],
    body: SearchDocumentsRequest,
) -> list[DocumentRecord]:
    document_ids = body.document_ids
    documents = await repository.get_documents(user_id, document_ids)
    return documents
