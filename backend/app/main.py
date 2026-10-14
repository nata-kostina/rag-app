import time
from contextlib import asynccontextmanager

import inngest
import inngest.fast_api
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware

from app.config import get_settings
from app.document_database import build_document_database
from app.documents.router import router as document_router
from app.exceptions import register_exception_handlers
from app.inngest.inngest_client import InngestClient
from app.logging_config import logger, setup_logging
from app.providers.open_ai_embedding_provider import OpenAiEmbeddingProvider
from app.providers.open_ai_llm_provider import OpenAiLlmProvider
from app.queries.router import router as query_router
from app.services.llm_service import LlmService
from app.services.rag_service import RagService
from app.vector_store.qdrant_client import build_vector_database
from app.vector_store.qdrant_vector_store import QdrantVectorStore

setup_logging()


@asynccontextmanager
async def lifespan(app: FastAPI):
    settings = get_settings()

    engine, session_factory = build_document_database(settings.database_url, settings)
    app.state.engine = engine
    app.state.session_factory = session_factory

    qdrant_client, collection_name = await build_vector_database(
        settings.qdrant_url, settings.qdrant_dimension, settings.qdrant_api_key
    )

    app.state.embedding_provider = OpenAiEmbeddingProvider(
        base_url=settings.openai_endpoint,
        api_key=settings.openai_api_key,
        model=settings.embedding_model,
        dimension=settings.embedding_dimension,
        batch_size=settings.batch_size,
        max_batch_retries=settings.max_batch_retries,
    )

    llm_provider = OpenAiLlmProvider(
        base_url=settings.openai_endpoint,
        api_key=settings.openai_api_key,
        model=settings.openai_model,
        temperature=settings.temperature,
    )

    app.state.llm_service = LlmService(llm_provider=llm_provider)

    app.state.rag_service = RagService(
        chunk_size=settings.splitter_chunk_overlap,
        chunk_overlap=settings.splitter_chunk_overlap,
        embedding_provider=app.state.embedding_provider,
        vector_store=QdrantVectorStore(client=qdrant_client, collection_name=collection_name),
        top_k=settings.top_k,
        score_threshold=settings.score_threshold
    )

    inngest_client = InngestClient(
        settings=get_settings(), rag_service=app.state.rag_service, session_factory=session_factory
    )

    from app.inngest.inngest_functions import ingest_document, save_query

    inngest.fast_api.serve(app, inngest_client.client, [ingest_document, save_query], serve_path="/api/ingest")

    yield

    await engine.dispose()
    await qdrant_client.close()


async def logging_middleware(request: Request, call_next):
    start_time = time.perf_counter()

    response = await call_next(request)

    process_time = (time.perf_counter() - start_time) * 1000
    status_code = response.status_code
    client_host = request.client.host if request.client else "unknown"

    if status_code < 300:
        status_str = f"\033[32m{status_code}\033[0m" 
    elif status_code < 500:
        status_str = f"\033[33m{status_code}\033[0m"  
    else:
        status_str = f"\033[31m{status_code}\033[0m"

    log_msg = f'{client_host} - "{request.method} {request.url.path}" {status_str} ({process_time:.2f}ms)'

    logger.info(log_msg)
    return response


def create_app():
    settings = get_settings()

    app = FastAPI(title="RAG APP", lifespan=lifespan)

    register_exception_handlers(app)

    app.middleware("http")(logging_middleware)

    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.allowed_origins.split(","),
        allow_methods=["*"],
        allow_headers=["*"],
    )
    app.include_router(document_router)
    app.include_router(query_router)

    return app
