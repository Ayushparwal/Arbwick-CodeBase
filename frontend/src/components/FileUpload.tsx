import React, { useState, useRef } from 'react';
import { UploadCloud, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { uploadPdf } from '../services/api';
import { UploadResponse } from '../types';

interface FileUploadProps {
  onUploadSuccess: (response: UploadResponse) => void;
}

export const FileUpload: React.FC<FileUploadProps> = ({ onUploadSuccess }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [lastUploaded, setLastUploaded] = useState<UploadResponse | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = async (file: File) => {
    if (!file.name.toLowerCase().endsWith('.pdf')) {
      setError('Please upload a valid PDF file.');
      return;
    }

    setError(null);
    setIsUploading(true);
    setUploadStatus('Extracting text & generating Jina embeddings...');

    try {
      const response = await uploadPdf(file);
      setLastUploaded(response);
      setUploadStatus(null);
      onUploadSuccess(response);
    } catch (err: any) {
      setError(err.message || 'Failed to process and vectorize PDF.');
      setUploadStatus(null);
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleSelectFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFile(e.target.files[0]);
    }
  };

  return (
    <div className="flex flex-col gap-3">
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={() => !isUploading && fileInputRef.current?.click()}
        className={`relative border-2 border-dashed rounded-2xl p-6 transition-all duration-200 cursor-pointer text-center flex flex-col items-center justify-center gap-3 ${
          isDragging
            ? 'border-teal-400 bg-teal-500/10 scale-[0.99]'
            : 'border-slate-700/80 bg-slate-900/40 hover:border-teal-500/50 hover:bg-slate-900/80'
        } ${isUploading ? 'opacity-80 pointer-events-none' : ''}`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,application/pdf"
          onChange={handleSelectFile}
          className="hidden"
          disabled={isUploading}
        />

        <div className="w-12 h-12 rounded-2xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-center text-teal-400 shadow-inner">
          {isUploading ? (
            <Loader2 className="w-6 h-6 animate-spin text-teal-400" />
          ) : (
            <UploadCloud className="w-6 h-6" />
          )}
        </div>

        <div>
          <p className="text-sm font-semibold text-slate-200">
            {isUploading ? 'Processing Document...' : 'Upload PDF Document'}
          </p>
          <p className="text-xs text-slate-400 mt-1">
            {isUploading
              ? uploadStatus || 'Vectorizing & indexing in Qdrant...'
              : 'Drag & drop or click to browse (Max 50MB)'}
          </p>
        </div>

        {isUploading && (
          <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden mt-1">
            <div className="bg-gradient-to-r from-teal-500 to-emerald-400 h-1.5 rounded-full animate-pulse w-full" />
          </div>
        )}
      </div>

      {/* Error Alert */}
      {error && (
        <div className="flex items-start gap-2.5 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {/* Success Notification */}
      {lastUploaded && !error && (
        <div className="flex items-start gap-2.5 p-3 rounded-xl bg-teal-500/10 border border-teal-500/20 text-teal-300 text-xs">
          <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-teal-400" />
          <div className="flex-1">
            <p className="font-semibold text-teal-200">{lastUploaded.filename}</p>
            <p className="text-[11px] text-teal-400/80 mt-0.5">
              {lastUploaded.total_pages} pages • {lastUploaded.total_chunks} chunks vectorized
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
