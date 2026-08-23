import React from 'react';
import { Sparkles, Database, Cpu, Activity } from 'lucide-react';
import { HealthStatus } from '../types';

interface HeaderProps {
  health: HealthStatus | null;
  isLoadingHealth: boolean;
}

export const Header: React.FC<HeaderProps> = ({ health, isLoadingHealth }) => {
  const isHealthy = health?.status === 'healthy';

  return (
    <header className="h-16 border-b border-slate-800/80 bg-slate-900/60 backdrop-blur-md px-6 flex items-center justify-between shrink-0 z-10">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-teal-500 to-emerald-400 p-[1px] shadow-lg shadow-teal-500/20">
          <div className="w-full h-full bg-slate-950 rounded-[11px] flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-teal-400" />
          </div>
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-bold text-white tracking-tight">DocuMind</h1>
            <span className="text-[10px] uppercase font-semibold px-2 py-0.5 rounded-full bg-teal-500/10 text-teal-400 border border-teal-500/20">
              RAG v1.0
            </span>
          </div>
          <p className="text-xs text-slate-400">PDF Q&A with Vector Cosine Search</p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        {/* Model tags */}
        <div className="hidden md:flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-800/70 border border-slate-700/60 text-xs text-slate-300">
            <Cpu className="w-3.5 h-3.5 text-amber-400" />
            <span>Groq: <b>gpt-oss-120b</b></span>
          </div>
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-800/70 border border-slate-700/60 text-xs text-slate-300">
            <Database className="w-3.5 h-3.5 text-sky-400" />
            <span>Jina v3 • Qdrant</span>
          </div>
        </div>

        {/* Health status badge */}
        <div
          className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium border ${
            isLoadingHealth
              ? 'bg-slate-800 border-slate-700 text-slate-400'
              : isHealthy
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
              : 'bg-amber-500/10 border-amber-500/30 text-amber-400'
          }`}
          title={
            health
              ? `Qdrant: ${health.qdrant_connected ? 'Connected' : 'Offline'} | Groq: ${health.groq_configured ? 'Configured' : 'Missing Key'} | Jina: ${health.jina_configured ? 'Configured' : 'Missing Key'}`
              : 'Checking backend status...'
          }
        >
          <span
            className={`w-2 h-2 rounded-full ${
              isLoadingHealth
                ? 'bg-slate-400 animate-pulse'
                : isHealthy
                ? 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]'
                : 'bg-amber-400 animate-ping'
            }`}
          />
          <Activity className="w-3.5 h-3.5" />
          <span>{isLoadingHealth ? 'Checking...' : isHealthy ? 'System Ready' : 'Degraded'}</span>
        </div>
      </div>
    </header>
  );
};
