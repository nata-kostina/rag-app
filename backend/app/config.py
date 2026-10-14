from functools import lru_cache
from pathlib import Path
from typing import Literal

from pydantic import computed_field
from pydantic_settings import BaseSettings, SettingsConfigDict

PROJECT_DIR = Path(__file__).parents[1]


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=PROJECT_DIR / ".env", env_file_encoding="utf-8", extra="ignore")

    environment: Literal["local", "production"]
    allowed_origins: str
    document_database_url: str
    
    inngest_base_url: str

    qdrant_url: str
    qdrant_api_key: str | None = None
    qdrant_dimension: int
    top_k: int = 2
    score_threshold: float = 0

    upload_dir: Path = PROJECT_DIR / "data" / "uploads"

    allowed_mime_types: set[str] = {"application/pdf"}
    allowed_extensions: set[str] = {".pdf"}

    openai_endpoint: str
    openai_api_key: str

    embedding_model: str
    embedding_dimension: int
    batch_size: int = 32
    max_batch_retries: int = 0

    splitter_chunk_size: int = 1000
    splitter_chunk_overlap: int = 200

    openai_model: str
    temperature: float = 0.2

    @computed_field
    @property
    def database_url(self) -> str:
        database_url = self.document_database_url

        is_sqlite = self.document_database_url.startswith("sqlite")

        if is_sqlite and self.document_database_url.startswith("sqlite://"):
            database_url = self.document_database_url.replace("sqlite://", "sqlite+aiosqlite://", 1)

        return database_url


@lru_cache
def get_settings() -> Settings:
    return Settings()  # type: ignore
