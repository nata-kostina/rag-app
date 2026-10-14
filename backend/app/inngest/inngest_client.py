import inngest
from sqlalchemy.ext.asyncio import async_sessionmaker

from app.config import Settings
from app.inngest.inngest_middleware import create_di_middleware
from app.logging_config import logger
from app.services.rag_service import RagService


class InngestClient:
    _instance: InngestClient | None = None
    client: inngest.Inngest

    def __new__(
        cls, *, settings: Settings, rag_service: RagService, session_factory: async_sessionmaker
    ) -> InngestClient:
        if cls._instance is None:
            cls._instance = super().__new__(cls)

            middleware = create_di_middleware(rag_service, session_factory)
            cls._instance.client = inngest.Inngest(
                app_id="RAG APP",
                logger=logger,
                is_production=settings.environment == "production",
                serializer=inngest.PydanticSerializer(),
                middleware=[middleware],
                api_base_url=settings.inngest_base_url,
            )
        return cls._instance

    @classmethod
    def get_client(cls) -> inngest.Inngest:
        if cls._instance is None or cls._instance.client is None:
            raise RuntimeError("InngestClient is not initialized!")
        return cls._instance.client
