import React, { useState, useRef, useEffect } from 'react';
import { Send, Trash2, Bot, Sparkles, SlidersHorizontal } from 'lucide-react';
import { ChatMessage, DocumentInfo } from '../types';
import { MessageBubble } from './MessageBubble';
import { sendChatMessage } from '../services/api';

interface ChatInterfaceProps {
  selectedDocId: string | null;
  documents: DocumentInfo[];
}

export const ChatInterface: React.FC<ChatInterfaceProps> = ({ selectedDocId, documents }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [topK, setTopK] = useState(5);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const activeDoc = documents.find((d) => d.document_id === selectedDocId);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async (textToSend?: string) => {
    const query = (textToSend || inputMessage).trim();
    if (!query || isSending) return;

    const userMessageId = String(Date.now());
    const assistantMessageId = String(Date.now() + 1);

    const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    // 1. Add user message
    const userMsg: ChatMessage = {
      id: userMessageId,
      role: 'user',
      content: query,
      timestamp: now,
    };

    // 2. Add loading assistant placeholder
    const loadingAssistantMsg: ChatMessage = {
      id: assistantMessageId,
      role: 'assistant',
      content: '',
      timestamp: now,
      isLoading: true,
    };

    setMessages((prev) => [...prev, userMsg, loadingAssistantMsg]);
    setInputMessage('');
    setIsSending(true);

    try {
      // 3. Call backend API
      const response = await sendChatMessage({
        message: query,
        document_id: selectedDocId || undefined,
        top_k: topK,
      });

      // 4. Update placeholder with actual response
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === assistantMessageId
            ? {
                ...msg,
                isLoading: false,
                content: response.answer,
                contexts: response.retrieved_contexts,
                model: response.model,
              }
            : msg
        )
      );
    } catch (err: any) {
      // 5. Update placeholder with error
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === assistantMessageId
            ? {
                ...msg,
                isLoading: false,
                error: true,
                content: err.message || 'Failed to get response from the backend.',
              }
            : msg
        )
      );
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const clearChat = () => {
    setMessages([]);
  };

  const sampleQuestions = [
    'What is the summary of this document?',
    'What are the key conclusions or findings?',
    'List any important dates, names, or metrics mentioned.',
  ];

  return (
    <div className="flex-1 flex flex-col h-full bg-slate-950/40 overflow-hidden">
      {/* Chat Sub-Header */}
      <div className="h-12 border-b border-slate-800/80 px-6 flex items-center justify-between shrink-0 bg-slate-900/30">
        <div className="flex items-center gap-2 text-xs">
          <span className="text-slate-400">Context:</span>
          <span className="font-medium px-2 py-0.5 rounded-md bg-slate-800 border border-slate-700 text-teal-300 truncate max-w-xs">
            {activeDoc ? activeDoc.filename : 'All Indexed Documents'}
          </span>
          <span className="text-slate-500">|</span>
          <div className="flex items-center gap-1.5 text-slate-400">
            <SlidersHorizontal className="w-3 h-3 text-slate-500" />
            <span>Top-K:</span>
            <select
              value={topK}
              onChange={(e) => setTopK(Number(e.target.value))}
              className="bg-slate-800 border border-slate-700 text-teal-300 rounded px-1.5 py-0.5 text-xs focus:outline-none focus:border-teal-500"
            >
              <option value={3}>3</option>
              <option value={5}>5</option>
              <option value={8}>8</option>
              <option value={10}>10</option>
            </select>
          </div>
        </div>

        {messages.length > 0 && (
          <button
            onClick={clearChat}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs text-slate-400 hover:text-rose-300 hover:bg-rose-500/10 transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Clear Chat</span>
          </button>
        )}
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center max-w-md mx-auto space-y-5">
            <div className="w-14 h-14 rounded-2xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-center text-teal-400 shadow-xl shadow-teal-500/5">
              <Bot className="w-7 h-7" />
            </div>

            <div className="space-y-1.5">
              <h2 className="text-lg font-bold text-white">Ask anything about your documents</h2>
              <p className="text-xs text-slate-400 leading-relaxed">
                Queries are embedded via Jina AI, matched via Qdrant cosine similarity, and answered by Groq GPT-OSS 120B with exact citations.
              </p>
            </div>

            <div className="w-full space-y-2 pt-2">
              <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider text-left">
                Suggested Prompts
              </p>
              <div className="flex flex-col gap-2">
                {sampleQuestions.map((q, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSend(q)}
                    className="w-full text-left px-3.5 py-2.5 rounded-xl bg-slate-900/60 border border-slate-800 text-xs text-slate-300 hover:border-teal-500/50 hover:bg-slate-800/80 hover:text-teal-300 transition-all flex items-center justify-between group"
                  >
                    <span>{q}</span>
                    <Sparkles className="w-3.5 h-3.5 text-slate-500 group-hover:text-teal-400 transition-colors" />
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : (
          messages.map((message) => <MessageBubble key={message.id} message={message} />)
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Form */}
      <div className="p-4 border-t border-slate-800/80 bg-slate-900/40 shrink-0">
        <div className="relative rounded-2xl bg-slate-900 border border-slate-800 focus-within:border-teal-500/60 focus-within:ring-1 focus-within:ring-teal-500/40 transition-all shadow-lg shadow-black/20">
          <textarea
            ref={inputRef}
            rows={2}
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={
              activeDoc
                ? `Ask about "${activeDoc.filename}"... (Enter to send)`
                : 'Ask questions across all indexed PDFs... (Enter to send)'
            }
            disabled={isSending}
            className="w-full bg-transparent px-4 pt-3 pb-10 text-sm text-slate-100 placeholder-slate-500 resize-none focus:outline-none"
          />

          <div className="absolute bottom-2.5 left-4 right-3 flex items-center justify-between">
            <span className="text-[10px] text-slate-500 hidden sm:inline">
              Press <b>Enter</b> to send, <b>Shift+Enter</b> for new line
            </span>

            <button
              onClick={() => handleSend()}
              disabled={!inputMessage.trim() || isSending}
              className="ml-auto flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-teal-500 hover:bg-teal-400 disabled:opacity-40 disabled:hover:bg-teal-500 text-slate-950 font-semibold text-xs transition-all shadow-md shadow-teal-500/20"
            >
              <span>Send</span>
              <Send className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
