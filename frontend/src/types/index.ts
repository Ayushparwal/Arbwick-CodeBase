export interface ContextChunk {
  chunk_id: string;
  document_id: string;
  filename: string;
  text: string;
  page_number: number;
  score: number;
}

export interface UploadResponse {
  document_id: string;
  filename: string;
  total_pages: number;
  total_chunks: number;
  status: string;
  message: string;
}

export interface ChatRequest {
  message: string;
  document_id?: string;
  top_k?: number;
}

export interface ChatResponse {
  answer: string;
  model: string;
  retrieved_contexts: ContextChunk[];
  document_id?: string;
}

export interface DocumentInfo {
  document_id: string;
  filename: string;
  total_chunks: number;
  created_at: string;
}

export interface HealthStatus {
  status: string;
  qdrant_connected: boolean;
  groq_configured: boolean;
  jina_configured: boolean;
  qdrant_collection_exists: boolean;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  contexts?: ContextChunk[];
  model?: string;
  isLoading?: boolean;
  error?: boolean;
}
