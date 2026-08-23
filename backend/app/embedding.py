import logging
from typing import List, Optional
import httpx
from app.config import get_settings

logger = logging.getLogger(__name__)


class JinaEmbeddingClient:
    """Direct HTTP client for Jina AI Embeddings API."""

    def __init__(self, api_key: Optional[str] = None, model: Optional[str] = None):
        settings = get_settings()
        self.api_key = api_key or settings.JINA_API_KEY
        self.model = model or settings.JINA_MODEL
        self.api_url = settings.JINA_API_URL

    async def get_embeddings(
        self,
        texts: List[str],
        task: str = "retrieval.passage",
        batch_size: int = 32
    ) -> List[List[float]]:
        """
        Generate embeddings for a list of text strings using Jina AI API.
        
        Args:
            texts: List of strings to embed.
            task: Jina AI task type ('retrieval.passage' for docs, 'retrieval.query' for queries).
            batch_size: Number of texts per batch request.

        Returns:
            List of embedding vectors (list of floats).
        """
        if not self.api_key:
            raise ValueError(
                "JINA_API_KEY is not configured. Please provide a valid Jina AI API key."
            )

        if not texts:
            return []

        all_embeddings: List[List[float]] = []
        headers = {
            "Content-Type": "application/json",
            "Authorization": f"Bearer {self.api_key}"
        }

        async with httpx.AsyncClient(timeout=60.0) as client:
            for i in range(0, len(texts), batch_size):
                batch_texts = texts[i:i + batch_size]
                payload = {
                    "model": self.model,
                    "task": task,
                    "dimensions": 1024,
                    "input": batch_texts
                }

                try:
                    response = await client.post(
                        self.api_url,
                        headers=headers,
                        json=payload
                    )
                    response.raise_for_status()
                    data = response.json()
                    
                    # Jina API response format: {"data": [{"embedding": [...], "index": 0}, ...]}
                    batch_embeddings = [item["embedding"] for item in data["data"]]
                    all_embeddings.extend(batch_embeddings)

                except httpx.HTTPStatusError as e:
                    logger.error(f"Jina AI API HTTP error {e.response.status_code}: {e.response.text}")
                    raise RuntimeError(
                        f"Jina AI API returned error {e.response.status_code}: {e.response.text}"
                    ) from e
                except Exception as e:
                    logger.error(f"Error calling Jina AI API: {e}")
                    raise RuntimeError(f"Failed to generate embeddings via Jina AI: {str(e)}") from e

        return all_embeddings

    async def get_query_embedding(self, query: str) -> List[float]:
        """Generate embedding for a single user query."""
        results = await self.get_embeddings([query], task="retrieval.query")
        if not results:
            raise RuntimeError("Failed to generate query embedding.")
        return results[0]
