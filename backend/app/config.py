from pydantic_settings import BaseSettings, SettingsConfigDict
from functools import lru_cache


class Settings(BaseSettings):
    """Application configuration settings loaded from environment variables."""

    # API Keys
    GROQ_API_KEY: str = ""
    JINA_API_KEY: str = ""

    # Model Configuration
    GROQ_MODEL: str = "openai/gpt-oss-120b"
    JINA_MODEL: str = "jina-embeddings-v3"

    # Qdrant Vector Store Configuration
    QDRANT_HOST: str = "localhost"
    QDRANT_PORT: int = 6333
    QDRANT_COLLECTION: str = "pdf_documents"
    VECTOR_DIMENSION: int = 1024  # Standard dimension for jina-embeddings-v3

    # Text Chunking Settings
    CHUNK_SIZE: int = 600
    CHUNK_OVERLAP: int = 100
    TOP_K: int = 5

    # Groq & Jina Base URLs
    GROQ_API_URL: str = "https://api.groq.com/openai/v1/chat/completions"
    JINA_API_URL: str = "https://api.jina.ai/v1/embeddings"

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore"
    )


@lru_cache()
def get_settings() -> Settings:
    """Return cached application settings."""
    return Settings()
