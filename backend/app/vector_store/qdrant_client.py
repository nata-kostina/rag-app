from qdrant_client import AsyncQdrantClient, models
from qdrant_client.models import Distance, VectorParams


async def build_vector_database(
    qdrant_url: str, dimension: int, qdrant_api_key: str | None = None
) -> tuple[AsyncQdrantClient, str]:
    qdrant_client = AsyncQdrantClient(url=qdrant_url, api_key=qdrant_api_key, timeout=60)
    collection_name = "documents"
    if not await qdrant_client.collection_exists(collection_name):
        await qdrant_client.create_collection(
            collection_name=collection_name, vectors_config=VectorParams(size=dimension, distance=Distance.COSINE)
        )

    await qdrant_client.create_payload_index(
        collection_name=collection_name, field_name="user_id", field_schema=models.PayloadSchemaType.UUID
    )
    return qdrant_client, collection_name
