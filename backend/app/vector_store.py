import logging
from datetime import datetime, timezone
from typing import List, Dict, Any, Optional
from qdrant_client import QdrantClient
from qdrant_client.http import models as qmodels
from app.config import get_settings
from app.models import ChunkData, ContextChunk, DocumentInfo

logger = logging.getLogger(__name__)


class QdrantVectorStore:
    """Manager for Qdrant vector database operations."""

    def __init__(self):
        settings = get_settings()
        self.host = settings.QDRANT_HOST
        self.port = settings.QDRANT_PORT
        self.collection_name = settings.QDRANT_COLLECTION
        self.vector_dim = settings.VECTOR_DIMENSION

        self.client = QdrantClient(
            host=self.host,
            port=self.port,
            timeout=10.0
        )

    def ensure_collection(self) -> bool:
        """Check if collection exists; if not, create it with Cosine distance."""
        try:
            collections = self.client.get_collections().collections
            existing_names = [c.name for c in collections]

            if self.collection_name not in existing_names:
                logger.info(f"Creating Qdrant collection '{self.collection_name}' with Cosine distance...")
                self.client.create_collection(
                    collection_name=self.collection_name,
                    vectors_config=qmodels.VectorParams(
                        size=self.vector_dim,
                        distance=qmodels.Distance.COSINE
                    )
                )
                logger.info(f"Collection '{self.collection_name}' created successfully.")
            return True
        except Exception as e:
            logger.error(f"Error ensuring Qdrant collection '{self.collection_name}': {e}")
            return False

    def upsert_chunks(
        self,
        document_id: str,
        filename: str,
        chunks: List[ChunkData],
        embeddings: List[List[float]]
    ) -> int:
        """
        Insert or update chunk vectors and metadata into Qdrant collection.
        """
        self.ensure_collection()

        created_at_iso = datetime.now(timezone.utc).isoformat()
        points: List[qmodels.PointStruct] = []

        for chunk, embedding in zip(chunks, embeddings):
            payload = {
                "chunk_id": chunk.chunk_id,
                "document_id": document_id,
                "filename": filename,
                "text": chunk.text,
                "page_number": chunk.page_number,
                "chunk_index": chunk.chunk_index,
                "created_at": created_at_iso
            }

            points.append(
                qmodels.PointStruct(
                    id=chunk.chunk_id,
                    vector=embedding,
                    payload=payload
                )
            )

        # Batch upsert points
        self.client.upsert(
            collection_name=self.collection_name,
            points=points,
            wait=True
        )

        return len(points)

    def search_similar(
        self,
        query_vector: List[float],
        top_k: int = 5,
        document_id: Optional[str] = None
    ) -> List[ContextChunk]:
        """
        Perform cosine similarity search in Qdrant.
        Optionally filters results by document_id.
        """
        self.ensure_collection()

        query_filter = None
        if document_id:
            query_filter = qmodels.Filter(
                must=[
                    qmodels.FieldCondition(
                        key="document_id",
                        match=qmodels.MatchValue(value=document_id)
                    )
                ]
            )

        try:
            # Using modern query_points interface
            response = self.client.query_points(
                collection_name=self.collection_name,
                query=query_vector,
                query_filter=query_filter,
                limit=top_k,
                with_payload=True
            )
            hits = response.points
        except Exception as e:
            logger.warning(f"query_points failed, falling back to search method: {e}")
            hits = self.client.search(
                collection_name=self.collection_name,
                query_vector=query_vector,
                query_filter=query_filter,
                limit=top_k,
                with_payload=True
            )

        results: List[ContextChunk] = []
        for hit in hits:
            payload = hit.payload or {}
            results.append(
                ContextChunk(
                    chunk_id=str(hit.id),
                    document_id=payload.get("document_id", ""),
                    filename=payload.get("filename", "unknown.pdf"),
                    text=payload.get("text", ""),
                    page_number=payload.get("page_number", 1),
                    score=float(hit.score)
                )
            )

        return results

    def list_documents(self) -> List[DocumentInfo]:
        """
        Aggregate indexed documents from Qdrant payloads.
        """
        self.ensure_collection()

        docs_map: Dict[str, Dict[str, Any]] = {}
        offset = None

        while True:
            scroll_result, next_offset = self.client.scroll(
                collection_name=self.collection_name,
                limit=100,
                offset=offset,
                with_payload=True,
                with_vectors=False
            )

            for point in scroll_result:
                payload = point.payload or {}
                doc_id = payload.get("document_id")
                if not doc_id:
                    continue

                if doc_id not in docs_map:
                    docs_map[doc_id] = {
                        "document_id": doc_id,
                        "filename": payload.get("filename", "unknown.pdf"),
                        "total_chunks": 0,
                        "created_at": payload.get("created_at", "")
                    }
                docs_map[doc_id]["total_chunks"] += 1

            if next_offset is None:
                break
            offset = next_offset

        return [DocumentInfo(**info) for info in docs_map.values()]

    def delete_document(self, document_id: str) -> bool:
        """
        Delete all vector points belonging to a specific document_id.
        """
        try:
            self.client.delete(
                collection_name=self.collection_name,
                points_selector=qmodels.FilterSelector(
                    filter=qmodels.Filter(
                        must=[
                            qmodels.FieldCondition(
                                key="document_id",
                                match=qmodels.MatchValue(value=document_id)
                            )
                        ]
                    )
                ),
                wait=True
            )
            return True
        except Exception as e:
            logger.error(f"Failed to delete document {document_id} from Qdrant: {e}")
            return False

    def is_healthy(self) -> bool:
        """Verify Qdrant server connection."""
        try:
            self.client.get_collections()
            return True
        except Exception:
            return False
