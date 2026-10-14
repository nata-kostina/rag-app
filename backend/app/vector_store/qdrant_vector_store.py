import uuid
from typing import Any

from qdrant_client import AsyncQdrantClient
from qdrant_client.conversions.common_types import QueryResponse
from qdrant_client.models import Filter, PointStruct


class QdrantVectorStore:
    def __init__(self, client: AsyncQdrantClient, collection_name: str) -> None:
        self._client = client
        self.collection_name = collection_name

    async def upsert(self, *, ids: list[uuid.UUID], vectors: list[Any], payloads: list[dict[str, Any]]) -> int:
        points = [PointStruct(id=ids[i], vector=vectors[i], payload=payloads[i]) for i in range(len(ids))]
        await self._client.upsert(self.collection_name, points=points)
        return len(ids)

    async def search(
        self, *, query_vector: list[float], filter: Filter, top_k: int, score_threshold: float
    ) -> QueryResponse:
        search_result = await self._client.query_points(
            collection_name=self.collection_name,
            query=query_vector,
            query_filter=filter,
            limit=top_k,
            with_payload=True,
            score_threshold=score_threshold,
        )
        return search_result
