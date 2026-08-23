import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { User, Sparkles, AlertCircle, BookOpen, Clock } from 'lucide-react';
import { ChatMessage } from '../types';
import { ContextModal } from './ContextModal';

interface MessageBubbleProps {
  message: ChatMessage;
}

export const MessageBubble: React.FC<MessageBubbleProps> = ({ message }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const isUser = message.role === 'user';

  return (
    <div className={`flex gap-3 w-full ${isUser ? 'justify-end' : 'justify-start'}`}>
      {/* Assistant Avatar */}
      {!isUser && (
        <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-teal-500 to-emerald-400 p-[1px] shrink-0 mt-0.5 shadow-md shadow-teal-500/10">
          <div className="w-full h-full bg-slate-950 rounded-[11px] flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-teal-400" />
          </div>
        </div>
      )}

      {/* Bubble Content */}
      <div className={`flex flex-col gap-1.5 max-w-[82%] ${isUser ? 'items-end' : 'items-start'}`}>
        <div
          className={`px-4 py-3 rounded-2xl text-sm leading-relaxed ${
            isUser
              ? 'bg-teal-600 text-white rounded-tr-sm shadow-md shadow-teal-600/10'
              : message.error
              ? 'bg-rose-500/10 border border-rose-500/30 text-rose-200 rounded-tl-sm'
              : 'bg-slate-900/90 border border-slate-800 text-slate-200 rounded-tl-sm shadow-sm'
          }`}
        >
          {message.isLoading ? (
            <div className="flex items-center gap-2 py-1 text-slate-400 text-xs">
              <span className="w-2 h-2 rounded-full bg-teal-400 animate-bounce" style={{ animationDelay: '0ms' }} />
              <span className="w-2 h-2 rounded-full bg-teal-400 animate-bounce" style={{ animationDelay: '150ms' }} />
              <span className="w-2 h-2 rounded-full bg-teal-400 animate-bounce" style={{ animationDelay: '300ms' }} />
              <span className="ml-1 text-slate-400">Searching vectors & inferring Groq OSS 120B...</span>
            </div>
          ) : message.error ? (
            <div className="flex items-start gap-2 text-rose-300">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{message.content}</span>
            </div>
          ) : isUser ? (
            <p className="whitespace-pre-wrap">{message.content}</p>
          ) : (
            <div className="prose prose-invert prose-sm max-w-none prose-p:leading-relaxed prose-pre:bg-slate-950 prose-pre:border prose-pre:border-slate-800">
              <ReactMarkdown>{message.content}</ReactMarkdown>
            </div>
          )}
        </div>

        {/* Footer Meta & Context Sources Button */}
        <div className="flex items-center gap-2 px-1 text-[11px] text-slate-500">
          <span className="flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {message.timestamp}
          </span>

          {!isUser && !message.isLoading && !message.error && message.contexts && message.contexts.length > 0 && (
            <>
              <span>•</span>
              <button
                onClick={() => setIsModalOpen(true)}
                className="flex items-center gap-1 text-teal-400 hover:text-teal-300 hover:underline font-medium cursor-pointer"
              >
                <BookOpen className="w-3 h-3" />
                <span>{message.contexts.length} Sources Cited</span>
              </button>
            </>
          )}

          {!isUser && message.model && (
            <>
              <span>•</span>
              <span className="text-slate-600 font-mono text-[10px]">{message.model}</span>
            </>
          )}
        </div>
      </div>

      {/* User Avatar */}
      {isUser && (
        <div className="w-8 h-8 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center shrink-0 mt-0.5 text-slate-300">
          <User className="w-4 h-4" />
        </div>
      )}

      {/* Context Inspection Modal */}
      {message.contexts && (
        <ContextModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          contexts={message.contexts}
        />
      )}
    </div>
  );
};
