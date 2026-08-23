import React, { useState, useEffect, useCallback } from 'react';
import { Header } from './components/Header';
import { FileUpload } from './components/FileUpload';
import { DocumentList } from './components/DocumentList';
import { ChatInterface } from './components/ChatInterface';
import { fetchDocuments, deleteDocument, checkHealth } from './services/api';
import { DocumentInfo, HealthStatus, UploadResponse } from './types';

export const App: React.FC = () => {
  const [documents, setDocuments] = useState<DocumentInfo[]>([]);
  const [selectedDocId, setSelectedDocId] = useState<string | null>(null);
  const [health, setHealth] = useState<HealthStatus | null>(null);
  const [isLoadingDocs, setIsLoadingDocs] = useState(false);
  const [isLoadingHealth, setIsLoadingHealth] = useState(true);

  // Load backend health
  const loadHealth = useCallback(async () => {
    try {
      const data = await checkHealth();
      setHealth(data);
    } catch {
      setHealth(null);
    } finally {
      setIsLoadingHealth(false);
    }
  }, []);

  // Load document list from Qdrant
  const loadDocuments = useCallback(async () => {
    setIsLoadingDocs(true);
    try {
      const docs = await fetchDocuments();
      setDocuments(docs);
    } catch (err) {
      console.error('Failed to load documents', err);
    } finally {
      setIsLoadingDocs(false);
    }
  }, []);

  useEffect(() => {
    loadHealth();
    loadDocuments();

    // Poll health status periodically
    const interval = setInterval(loadHealth, 30000);
    return () => clearInterval(interval);
  }, [loadHealth, loadDocuments]);

  const handleUploadSuccess = (response: UploadResponse) => {
    loadDocuments();
    setSelectedDocId(response.document_id);
  };

  const handleDeleteDoc = async (docId: string) => {
    try {
      await deleteDocument(docId);
      if (selectedDocId === docId) {
        setSelectedDocId(null);
      }
      loadDocuments();
    } catch (err) {
      console.error('Failed to delete document', err);
    }
  };

  return (
    <div className="flex flex-col h-screen w-screen bg-slate-950 text-slate-100 overflow-hidden">
      {/* Top Header */}
      <Header health={health} isLoadingHealth={isLoadingHealth} />

      {/* Main Split Layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar: PDF Upload & Vector Store Index */}
        <aside className="w-80 md:w-96 border-r border-slate-800/80 bg-slate-900/30 flex flex-col p-4 gap-6 overflow-y-auto shrink-0">
          <FileUpload onUploadSuccess={handleUploadSuccess} />
          <div className="border-t border-slate-800/80 pt-4">
            <DocumentList
              documents={documents}
              selectedDocId={selectedDocId}
              onSelectDoc={setSelectedDocId}
              onDeleteDoc={handleDeleteDoc}
              isLoading={isLoadingDocs}
            />
          </div>
        </aside>

        {/* Right Chat Interface */}
        <main className="flex-1 flex flex-col h-full overflow-hidden">
          <ChatInterface selectedDocId={selectedDocId} documents={documents} />
        </main>
      </div>
    </div>
  );
};

export default App;
