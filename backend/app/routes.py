import uuid
import logging
from typing import List
from fastapi import APIRouter, UploadFile, File, HTTPException, status
from app.config import get_settings
from app.models import (
    UploadResponse,
    ChatRequest,
    ChatResponse,
    DocumentInfo,
    HealthResponse
)
from app.chunker import extract_text_from_pdf, chunk_text
from app.embedding import JinaEmbeddingClient
from app.vector_store import QdrantVectorStore
from app.llm import GroqLLMClient

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api", tags=["RAG Application"])

# Service instances
embedding_client = JinaEmbeddingClient()
vector_store = QdrantVectorStore()
llm_client = GroqLLMClient()


@router.post("/upload", response_model=UploadResponse, status_code=status.HTTP_201_CREATED)
async def upload_pdf(file: UploadFile = File(...)):
    """
    Upload and process a PDF file:
    1. Extract text and track page numbers.
    2. Split text into overlapping semantic chunks.
    3. Generate embeddings using Jina AI API.
    4. Store chunks and vectors in Qdrant with Cosine distance indexing.
    """
    if not file.filename.lower().endswith(".pdf"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid file format. Only PDF files (.pdf) are supported."
        )

    try:
        pdf_bytes = await file.read()
        if len(pdf_bytes) == 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="The uploaded PDF file is empty."
            )

        # 1. Extract text
        pages = extract_text_from_pdf(pdf_bytes)
        if not pages:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Could not extract readable text from this PDF. It might be scanned or image-only."
            )

        settings = get_settings()
        # 2. Chunk text
        chunks = chunk_text(
            pages,
            chunk_size=settings.CHUNK_SIZE,
            chunk_overlap=settings.CHUNK_OVERLAP
        )
        if not chunks:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="No chunks generated from the extracted text."
            )

        # 3. Generate embeddings via Jina AI
        chunk_texts = [chunk.text for chunk in chunks]
        embeddings = await embedding_client.get_embeddings(
            texts=chunk_texts,
            task="retrieval.passage"
        )

        # 4. Upsert vectors to Qdrant
        document_id = str(uuid.uuid4())
        total_inserted = vector_store.upsert_chunks(
            document_id=document_id,
            filename=file.filename,
            chunks=chunks,
            embeddings=embeddings
        )

        return UploadResponse(
            document_id=document_id,
            filename=file.filename,
            total_pages=len(pages),
            total_chunks=total_inserted,
            status="success",
            message=f"Successfully indexed '{file.filename}' with {total_inserted} chunks."
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error during PDF processing: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to process and vectorize PDF: {str(e)}"
        )


@router.post("/chat", response_model=ChatResponse)
async def chat_with_pdf(request: ChatRequest):
    """
    Query the indexed PDF vectors and generate an answer using Groq LLM:
    1. Embed user query using Jina AI API.
    2. Perform Cosine similarity search in Qdrant for top-k chunks.
    3. Inject retrieved context into Groq prompt and infer answer.
    """
    settings = get_settings()
    top_k = request.top_k or settings.TOP_K

    try:
        # 1. Embed query
        query_vector = await embedding_client.get_query_embedding(request.message)

        # 2. Retrieve top-k context chunks from Qdrant
        context_chunks = vector_store.search_similar(
            query_vector=query_vector,
            top_k=top_k,
            document_id=request.document_id
        )

        # 3. Generate answer from Groq LLM (direct HTTP call)
        answer = await llm_client.generate_answer(
            query=request.message,
            contexts=context_chunks
        )

        return ChatResponse(
            answer=answer,
            model=settings.GROQ_MODEL,
            retrieved_contexts=context_chunks,
            document_id=request.document_id
        )

    except Exception as e:
        logger.error(f"Error during chat inference: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Chat generation failed: {str(e)}"
        )


@router.get("/documents", response_model=List[DocumentInfo])
async def list_documents():
    """List all indexed documents in Qdrant."""
    try:
        return vector_store.list_documents()
    except Exception as e:
        logger.error(f"Error listing documents: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to list documents: {str(e)}"
        )


@router.delete("/documents/{document_id}")
async def delete_document(document_id: str):
    """Delete a document and all its chunks from Qdrant."""
    success = vector_store.delete_document(document_id)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to delete document {document_id}"
        )
    return {"status": "success", "message": f"Document {document_id} deleted successfully."}


@router.get("/health", response_model=HealthResponse)
async def health_check():
    """Verify backend system status and connectivity."""
    settings = get_settings()
    qdrant_ok = vector_store.is_healthy()
    groq_ok = bool(settings.GROQ_API_KEY.strip())
    jina_ok = bool(settings.JINA_API_KEY.strip())

    overall_status = "healthy" if (qdrant_ok and groq_ok and jina_ok) else "degraded"

    return HealthResponse(
        status=overall_status,
        qdrant_connected=qdrant_ok,
        groq_configured=groq_ok,
        jina_configured=jina_ok,
        qdrant_collection_exists=qdrant_ok
    )
