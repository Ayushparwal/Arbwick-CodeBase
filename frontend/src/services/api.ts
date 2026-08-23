import {
  UploadResponse,
  ChatRequest,
  ChatResponse,
  DocumentInfo,
  HealthStatus
} from '../types';

const API_BASE = '/api';

export async function uploadPdf(file: File): Promise<UploadResponse> {
  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch(`${API_BASE}/upload`, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ detail: response.statusText }));
    throw new Error(errorData.detail || 'Failed to upload and vectorize PDF');
  }

  return response.json();
}

export async function sendChatMessage(request: ChatRequest): Promise<ChatResponse> {
  const response = await fetch(`${API_BASE}/chat`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ detail: response.statusText }));
    throw new Error(errorData.detail || 'Failed to generate answer from Groq LLM');
  }

  return response.json();
}

export async function fetchDocuments(): Promise<DocumentInfo[]> {
  const response = await fetch(`${API_BASE}/documents`);
  if (!response.ok) {
    throw new Error('Failed to fetch documents');
  }
  return response.json();
}

export async function deleteDocument(docId: string): Promise<void> {
  const response = await fetch(`${API_BASE}/documents/${docId}`, {
    method: 'DELETE',
  });
  if (!response.ok) {
    throw new Error('Failed to delete document');
  }
}

export async function checkHealth(): Promise<HealthStatus> {
  const response = await fetch(`${API_BASE}/health`);
  if (!response.ok) {
    throw new Error('Health check request failed');
  }
  return response.json();
}
