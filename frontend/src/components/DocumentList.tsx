import React from 'react';
import { FileText, Trash2, Layers, Check, Globe } from 'lucide-react';
import { DocumentInfo } from '../types';

interface DocumentListProps {
  documents: DocumentInfo[];
  selectedDocId: string | null;
  onSelectDoc: (docId: string | null) => void;
  onDeleteDoc: (docId: string) => void;
  isLoading: boolean;
}

export const DocumentList: React.FC<DocumentListProps> = ({
  documents,
  selectedDocId,
  onSelectDoc,
  onDeleteDoc,
  isLoading
}) => {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-slate-400">
          <Layers className="w-3.5 h-3.5 text-teal-400" />
          <span>Vector Index ({documents.length})</span>
        </div>
      </div>

      {/* "All Documents" toggle button */}
      <button
        onClick={() => onSelectDoc(null)}
        className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-left text-xs font-medium transition-all ${
          selectedDocId === null
            ? 'bg-teal-500/15 border border-teal-500/40 text-teal-300 shadow-sm'
            : 'bg-slate-900/40 border border-slate-800 text-slate-400 hover:bg-slate-800/60 hover:text-slate-200'
        }`}
      >
        <div className="flex items-center gap-2.5 truncate">
          <Globe className={`w-4 h-4 shrink-0 ${selectedDocId === null ? 'text-teal-400' : 'text-slate-500'}`} />
          <span className="truncate">All Indexed Documents</span>
        </div>
        {selectedDocId === null && <Check className="w-3.5 h-3.5 text-teal-400 shrink-0" />}
      </button>

      {/* Document Items */}
      <div className="flex flex-col gap-1.5 max-h-56 overflow-y-auto pr-1">
        {isLoading && documents.length === 0 ? (
          <div className="text-center py-4 text-xs text-slate-500">Loading indexed documents...</div>
        ) : documents.length === 0 ? (
          <div className="text-center py-4 text-xs text-slate-500 border border-dashed border-slate-800/80 rounded-xl">
            No PDFs indexed yet. Upload one above to get started!
          </div>
        ) : (
          documents.map((doc) => {
            const isSelected = selectedDocId === doc.document_id;
            return (
              <div
                key={doc.document_id}
                onClick={() => onSelectDoc(doc.document_id)}
                className={`group flex items-center justify-between px-3 py-2.5 rounded-xl border text-xs cursor-pointer transition-all ${
                  isSelected
                    ? 'bg-teal-500/15 border-teal-500/40 text-teal-300'
                    : 'bg-slate-900/40 border-slate-800/80 text-slate-300 hover:bg-slate-800/60 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0 flex-1">
                  <FileText
                    className={`w-4 h-4 shrink-0 ${isSelected ? 'text-teal-400' : 'text-slate-400'}`}
                  />
                  <div className="min-w-0 flex-1">
                    <p className="font-medium truncate text-slate-200">{doc.filename}</p>
                    <p className="text-[10px] text-slate-400 mt-0.5">
                      {doc.total_chunks} chunks
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 ml-2">
                  {isSelected && <Check className="w-3.5 h-3.5 text-teal-400 shrink-0" />}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (confirm(`Remove "${doc.filename}" from vector store?`)) {
                        onDeleteDoc(doc.document_id);
                      }
                    }}
                    title="Delete document vectors"
                    className="p-1 rounded-lg opacity-0 group-hover:opacity-100 hover:bg-rose-500/20 hover:text-rose-400 text-slate-500 transition-all"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
