import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routes import router, vector_store

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)
logger = logging.getLogger("rag_backend")


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Lifespan context manager for startup and shutdown routines."""
    logger.info("Initializing RAG Backend service...")
    try:
        # Check and ensure Qdrant collection is ready
        created = vector_store.ensure_collection()
        if created:
            logger.info("Qdrant collection ready.")
        else:
            logger.warning("Could not connect to Qdrant at startup. Will retry on first request.")
    except Exception as e:
        logger.warning(f"Qdrant startup connection deferred: {e}")

    yield

    logger.info("Shutting down RAG Backend service...")


app = FastAPI(
    title="PDF RAG API",
    description="Modular Retrieval-Augmented Generation API powered by Groq (GPT-OSS 120B), Jina AI Embeddings, and Qdrant Vector DB.",
    version="1.0.0",
    lifespan=lifespan
)

# Enable CORS for frontend clients
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows all origins for Docker Compose / dev flexibility
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API endpoints
app.include_router(router)


@app.get("/")
def root():
    """Root endpoint displaying service metadata."""
    return {
        "service": "PDF RAG Backend",
        "status": "online",
        "docs_url": "/docs",
        "health_url": "/api/health"
    }
