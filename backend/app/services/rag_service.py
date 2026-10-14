from __future__ import annotations

import asyncio
import uuid
from pathlib import Path

from llama_index.core.node_parser import SentenceSplitter
from llama_index.readers.file import PDFReader
from qdrant_client import models
from qdrant_client.models import Filter

from app.providers.schemas import EmbeddingProvider
from app.services.schemas import RagSearchResult
from app.vector_store.qdrant_vector_store import QdrantVectorStore


class RagService:
    def __init__(
        self,
        *,
        chunk_size: int,
        chunk_overlap: int,
        embedding_provider: EmbeddingProvider,
        vector_store: QdrantVectorStore,
        top_k: int,
        score_threshold: float,
        collection_name: str = "documents",
    ):
        self.chunk_size = chunk_size
        self.chunk_overlap = chunk_overlap
        self.splitter = SentenceSplitter(chunk_size=self.chunk_size, chunk_overlap=self.chunk_overlap)
        self._embedding_provider = embedding_provider
        self._vector_store = vector_store
        self.collection_name = collection_name
        self.top_k = top_k
        self.score_threshold = score_threshold

    async def load_document(self, path: Path) -> list[str]:
        documents = await asyncio.to_thread(self._sync_load_document, path)
        return documents

    def _sync_load_document(self, path: Path) -> list[str]:
        documents = PDFReader().load_data(file=path)
        return [document.text for document in documents]

    async def split_document(self, texts: list[str]) -> list[str]:
        chunks = await asyncio.to_thread(self._sync_split_document, texts)
        return chunks

    def _sync_split_document(self, texts: list[str]) -> list[str]:
        chunks: list[str] = []
        for t in texts:
            chunks.extend(self.splitter.split_text(t))
        return chunks

    async def embed_texts(self, chunks: list[str]) -> list[list[float]]:
        cleaned_chunks = [chunk.strip() for chunk in chunks if chunk and chunk.strip()]

        if not cleaned_chunks:
            return []

        return await self._embedding_provider.embed(cleaned_chunks)

    async def save_embeddings(
        self,
        *,
        chunks: list[str],
        doc_id: uuid.UUID,
        original_filename: str,
        embeddings: list[list[float]],
        user_id: uuid.UUID,
    ) -> int:
        if not embeddings or not chunks:
            return 0
        ids = [uuid.uuid5(uuid.NAMESPACE_URL, f"{doc_id}:{i}") for i in range(len(embeddings))]
        payloads = [
            {"doc_id": doc_id, "original_filename": original_filename, "user_id": user_id, "text": chunks[i]}
            for i in range(len(embeddings))
        ]
        num_embedded = await self._vector_store.upsert(ids=ids, vectors=embeddings, payloads=payloads)
        return num_embedded

    async def search(self, query_vector: list[float], user_id: uuid.UUID) -> list[RagSearchResult]:
        filter: Filter = models.Filter(
            must=[models.FieldCondition(key="user_id", match=models.MatchValue(value=str(user_id)))]
        )
        search_result = await self._vector_store.search(
            query_vector=query_vector, filter=filter, top_k=self.top_k, score_threshold=self.score_threshold
        )

        result: list[RagSearchResult] = []

        for item in search_result.points:
            chunk_id = str(item.id)
            payload = item.payload or {}
            doc_id = payload.get("doc_id", "")
            original_filename = payload.get("original_filename", "")
            text = payload.get("text", "")
            result.append(RagSearchResult(id=chunk_id, doc_id=doc_id, original_filename=original_filename, text=text))

        return result
