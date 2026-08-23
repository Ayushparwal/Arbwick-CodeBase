import React from 'react';
import { X, BookOpen, Hash, Percent } from 'lucide-react';
import { ContextChunk } from '../types';

interface ContextModalProps {
  isOpen: boolean;
  onClose: () => void;
  contexts: ContextChunk[];
}

export const ContextModal: React.FC<ContextModalProps> = ({ isOpen, onClose, contexts }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl max-h-[80vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/80">
          <div className="flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-teal-400" />
            <h3 className="text-base font-semibold text-white">Retrieved Context Chunks ({contexts.length})</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Chunks List */}
        <div className="p-6 overflow-y-auto space-y-4">
          {contexts.map((ctx, idx) => (
            <div
              key={ctx.chunk_id || idx}
              className="p-4 rounded-xl bg-slate-950/60 border border-slate-800/80 hover:border-slate-700 transition-all space-y-2.5"
            >
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2 font-medium text-teal-300">
                  <span className="px-2 py-0.5 rounded-md bg-teal-500/10 border border-teal-500/20">
                    Chunk #{idx + 1}
                  </span>
                  <span className="text-slate-400">{ctx.filename}</span>
                </div>
                <div className="flex items-center gap-3 text-slate-400">
                  <span className="flex items-center gap-1">
                    <Hash className="w-3.5 h-3.5 text-slate-500" />
                    Page {ctx.page_number}
                  </span>
                  <span className="flex items-center gap-1 font-mono text-emerald-400">
                    <Percent className="w-3.5 h-3.5 text-emerald-500" />
                    {(ctx.score * 100).toFixed(1)}% match
                  </span>
                </div>
              </div>

              <div className="p-3 rounded-lg bg-slate-900/90 text-xs text-slate-300 font-mono leading-relaxed whitespace-pre-wrap selection:bg-teal-500/30">
                {ctx.text}
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-800 bg-slate-900/60 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 text-xs font-medium text-slate-300 hover:bg-slate-700 hover:text-white transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
