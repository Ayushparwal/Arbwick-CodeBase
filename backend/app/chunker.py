import io
import uuid
import re
from typing import List, Tuple
from pypdf import PdfReader
from app.models import ChunkData


def clean_text(text: str) -> str:
    """Clean and normalize extracted PDF text."""
    if not text:
        return ""
    # Replace multiple whitespaces/newlines with single spaces while preserving paragraph breaks
    text = re.sub(r'\r\n', '\n', text)
    text = re.sub(r'[ \t]+', ' ', text)
    text = re.sub(r'\n{3,}', '\n\n', text)
    return text.strip()


def extract_text_from_pdf(pdf_bytes: bytes) -> List[Tuple[int, str]]:
    """
    Extract text per page from raw PDF bytes using pypdf.
    Returns a list of tuples: (page_number (1-indexed), page_text).
    """
    reader = PdfReader(io.BytesIO(pdf_bytes))
    pages_content: List[Tuple[int, str]] = []

    for index, page in enumerate(reader.pages):
        page_num = index + 1
        try:
            raw_text = page.extract_text() or ""
            cleaned = clean_text(raw_text)
            if cleaned:
                pages_content.append((page_num, cleaned))
        except Exception as e:
            # Continue extracting remaining pages if a single page fails
            print(f"Warning: Failed to extract text from page {page_num}: {e}")
            continue

    return pages_content


def chunk_text(
    pages: List[Tuple[int, str]],
    chunk_size: int = 600,
    chunk_overlap: int = 100
) -> List[ChunkData]:
    """
    Split extracted PDF page texts into overlapping chunks while tracking page numbers.
    Uses sliding window approach with word boundary awareness.
    """
    chunks: List[ChunkData] = []
    chunk_index = 0

    for page_num, page_text in pages:
        if not page_text:
            continue

        # If text is smaller than chunk_size, keep as a single chunk
        if len(page_text) <= chunk_size:
            chunks.append(
                ChunkData(
                    chunk_id=str(uuid.uuid4()),
                    text=page_text,
                    page_number=page_num,
                    chunk_index=chunk_index
                )
            )
            chunk_index += 1
            continue

        # Sliding window over the page text
        start = 0
        text_length = len(page_text)

        while start < text_length:
            end = min(start + chunk_size, text_length)

            # Adjust end boundary to nearest space/newline if not at the end of the text
            if end < text_length:
                last_space = page_text.rfind(' ', start, end)
                last_newline = page_text.rfind('\n', start, end)
                split_point = max(last_space, last_newline)
                if split_point > start + (chunk_size // 2):
                    end = split_point

            chunk_content = page_text[start:end].strip()
            if chunk_content:
                chunks.append(
                    ChunkData(
                        chunk_id=str(uuid.uuid4()),
                        text=chunk_content,
                        page_number=page_num,
                        chunk_index=chunk_index
                    )
                )
                chunk_index += 1

            if end >= text_length:
                break

            # Move start forward by step size (chunk_size - chunk_overlap)
            start = end - chunk_overlap if end - chunk_overlap > start else end

    return chunks
