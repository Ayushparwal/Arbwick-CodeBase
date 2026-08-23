# PDF RAG Application (React + FastAPI + Qdrant + Groq + Jina AI)

A modern, containerized Retrieval-Augmented Generation (RAG) system that allows you to upload PDF documents, extract and chunk text, generate embeddings via Jina AI, store vectors in Qdrant, and perform conversational Q&A powered by Groq's `openai/gpt-oss-120b` model using direct HTTP calls (no LangChain).

---

## Features

- **Frontend**: Single-page application built with React, Vite, TypeScript, and Tailwind CSS.
  - Drag-and-drop PDF upload with real-time status and chunk stats.
  - Interactive chat interface with Markdown formatting and source context citations.
  - Document switcher and health status indicator.
- **Backend**: Modular Python FastAPI service.
  - `chunker.py`: PDF text extraction using `pypdf` with sliding-window chunking.
  - `embedding.py`: Asynchronous batch embeddings via Jina AI API (`jina-embeddings-v3`).
  - `vector_store.py`: Qdrant vector store management with Cosine similarity indexing.
  - `llm.py`: Direct HTTP calls to Groq API (`openai/gpt-oss-120b`) with prompt context injection.
  - `routes.py`: Clean REST endpoints for upload, chat, document management, and health checks.
- **Vector Database**: Open-source Qdrant container with persistent volume storage.
- **Docker Compose**: One-command build and run.

---

## Quick Start

### 1. Configure Environment Variables
Copy `.env.example` to `.env` and provide your API keys:

```bash
cp .env.example .env
```

Edit `.env`:
```env
GROQ_API_KEY=your_actual_groq_api_key
JINA_API_KEY=your_actual_jina_ai_api_key
```

### 2. Start the Stack

```bash
docker compose up --build
```

### 3. Access the Services

- **Frontend Web UI**: [http://localhost:3000](http://localhost:3000)
- **Backend API & Swagger Docs**: [http://localhost:8000/docs](http://localhost:8000/docs)
- **Qdrant Web Dashboard**: [http://localhost:6333/dashboard](http://localhost:6333/dashboard)

---

## API Endpoints

- `POST /api/upload`: Upload and vectorize a PDF document (`multipart/form-data`).
- `POST /api/chat`: Send a question to query vectors and generate Groq answers.
- `GET /api/documents`: List currently indexed documents.
- `DELETE /api/documents/{doc_id}`: Remove a document and its vectors from Qdrant.
- `GET /api/health`: System health and API key configuration check.
