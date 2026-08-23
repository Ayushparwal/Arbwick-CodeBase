import logging
from typing import List, Optional
import httpx
from app.config import get_settings
from app.models import ContextChunk

logger = logging.getLogger(__name__)


class GroqLLMClient:
    """Direct HTTP client for Groq LLM inference without LangChain."""

    def __init__(self, api_key: Optional[str] = None, model: Optional[str] = None):
        settings = get_settings()
        self.api_key = api_key or settings.GROQ_API_KEY
        self.model = model or settings.GROQ_MODEL
        self.api_url = settings.GROQ_API_URL

    def build_prompt_with_context(
        self,
        query: str,
        contexts: List[ContextChunk]
    ) -> List[dict]:
        """
        Construct system and user messages containing retrieved vector context.
        """
        if not contexts:
            context_block = "No relevant context found from the uploaded documents."
        else:
            context_pieces = []
            for i, ctx in enumerate(contexts, 1):
                citation_header = f"--- [Source #{i}] File: {ctx.filename} | Page: {ctx.page_number} | Relevance: {ctx.score:.4f} ---"
                context_pieces.append(f"{citation_header}\n{ctx.text}\n")
            context_block = "\n".join(context_pieces)

        system_message = (
            "You are a helpful, accurate, and precise AI assistant specialized in analyzing PDF documents.\n"
            "Answer the user's question using ONLY the provided document context below.\n"
            "Guidelines:\n"
            "1. Base your answer strictly on the provided context.\n"
            "2. When stating facts, cite the source document and page number (e.g. '[Source #1, Page 3]').\n"
            "3. If the context does not contain enough information to answer the question, clearly state that the information is not present in the document.\n"
            "4. Format your response cleanly using Markdown.\n\n"
            f"=== DOCUMENT CONTEXT ===\n{context_block}\n=== END OF CONTEXT ==="
        )

        messages = [
            {"role": "system", "content": system_message},
            {"role": "user", "content": query}
        ]

        return messages

    async def generate_answer(
        self,
        query: str,
        contexts: List[ContextChunk],
        temperature: float = 0.2
    ) -> str:
        """
        Execute direct HTTP POST call to Groq Chat Completions API.
        """
        if not self.api_key:
            raise ValueError(
                "GROQ_API_KEY is not configured. Please provide a valid Groq API key."
            )

        messages = self.build_prompt_with_context(query, contexts)

        headers = {
            "Content-Type": "application/json",
            "Authorization": f"Bearer {self.api_key}"
        }

        payload = {
            "model": self.model,
            "messages": messages,
            "temperature": temperature,
            "max_tokens": 4096
        }

        async with httpx.AsyncClient(timeout=60.0) as client:
            try:
                response = await client.post(
                    self.api_url,
                    headers=headers,
                    json=payload
                )
                response.raise_for_status()
                data = response.json()

                # Parse standard OpenAI-compatible Groq response
                choices = data.get("choices", [])
                if not choices:
                    raise RuntimeError("Groq API returned an empty choices array.")

                answer = choices[0].get("message", {}).get("content", "")
                return answer.strip()

            except httpx.HTTPStatusError as e:
                logger.error(f"Groq API HTTP error {e.response.status_code}: {e.response.text}")
                raise RuntimeError(
                    f"Groq API error ({e.response.status_code}): {e.response.text}"
                ) from e
            except Exception as e:
                logger.error(f"Error calling Groq API: {e}")
                raise RuntimeError(f"Failed to generate answer from Groq: {str(e)}") from e
