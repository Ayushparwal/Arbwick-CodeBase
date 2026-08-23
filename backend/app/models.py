from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field


class ChunkData(BaseModel):
    """Represents a chunk extracted from a document."""
    chunk_id: str
    text: str
    page_number: int
    chunk_index: int


class UploadResponse(BaseModel):
    """Response returned upon successful PDF upload and vectorization."""
    document_id: str
    filename: str
    total_pages: int
    total_chunks: int
    status: str
    message: str


class ContextChunk(BaseModel):
    """Context chunk returned along with chat response for citation inspection."""
    chunk_id: str
    document_id: str
    filename: str
    text: str
    page_number: int
    score: float


class ChatRequest(BaseModel):
    """Request payload for asking a question."""
    message: str = Field(..., min_length=1, description="User question or prompt")
    document_id: Optional[str] = Field(None, description="Optional document ID to restrict search to a single document")
    top_k: Optional[int] = Field(5, ge=1, le=20, description="Number of context chunks to retrieve")


class ChatResponse(BaseModel):
    """Response payload for chat completions."""
    answer: str
    model: str
    retrieved_contexts: List[ContextChunk]
    document_id: Optional[str] = None


class DocumentInfo(BaseModel):
    """Metadata about an indexed document."""
    document_id: str
    filename: str
    total_chunks: int
    created_at: str


class HealthResponse(BaseModel):
    """System health status."""
    status: str
    qdrant_connected: bool
    groq_configured: bool
    jina_configured: bool
    qdrant_collection_exists: bool
