import React, { useState, useEffect } from 'react';
import {
  Settings,
  RefreshCw,
  FileCode,
  HardDrive,
  Terminal,
  Cpu
} from 'lucide-react';
import { api } from '../services/api';
import { SystemDiagnostics } from '../types/resume';

export const DiagnosticsPage: React.FC = () => {
  const [diag, setDiag] = useState<SystemDiagnostics | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const fetchDiagnostics = async () => {
    setLoading(true);
    try {
      const data = await api.getDiagnostics();
      setDiag(data);
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDiagnostics();
  }, []);

  return (
    <div className="max-w-4xl mx-auto px-6 py-8 space-y-6 w-full">
      <div className="flex items-center justify-between border-b border-[#DEDEDE] pb-4">
        <div>
          <h1 className="text-xl font-semibold text-[#222222] tracking-tight flex items-center gap-2">
            <Settings className="w-5 h-5 text-[#222222]" />
            System Readiness Diagnostics
          </h1>
          <p className="text-xs text-[#666666] mt-0.5">
            Real-time status of local LaTeX compilation, Ollama inference, and SQLite storage.
          </p>
        </div>

        <button
          onClick={fetchDiagnostics}
          disabled={loading}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-white hover:bg-[#F0F0F0] text-[#222222] border border-[#DEDEDE] transition-colors disabled:opacity-40 rounded-none cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh Status</span>
        </button>
      </div>

      {loading && !diag ? (
        <div className="py-16 text-center text-xs text-[#888888]">Checking system dependencies...</div>
      ) : diag ? (
        <div className="space-y-4">
          {/* LaTeX Compiler Card */}
          <div className="p-4 bg-white border border-[#DEDEDE] space-y-3 rounded-none">
            <div className="flex items-center justify-between border-b border-[#DEDEDE] pb-2">
              <div className="flex items-center gap-2.5">
                <FileCode className="w-4 h-4 text-[#222222]" />
                <div>
                  <h3 className="font-semibold text-[#222222] text-xs">LaTeX Engine</h3>
                  <p className="text-[11px] text-[#666666]">Local compiler for PDF generation</p>
                </div>
              </div>
              <span className={`text-[11px] font-mono px-2 py-0.5 border ${diag.latex.available ? 'bg-[#F7F7F7] border-[#2e7d32] text-[#2e7d32]' : 'bg-[#F7F7F7] border-[#b26a00] text-[#b26a00]'}`}>
                {diag.latex.available ? 'Available' : 'Missing'}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs text-[#444444]">
              <div className="p-2 bg-[#F7F7F7] border border-[#DEDEDE] rounded-none">
                <span className="text-[10px] text-[#666666] uppercase block">Compiler Type</span>
                <span className="font-mono text-[#222222]">{diag.latex.compiler_type || 'None'}</span>
              </div>
              <div className="p-2 bg-[#F7F7F7] border border-[#DEDEDE] rounded-none">
                <span className="text-[10px] text-[#666666] uppercase block">Executable Path</span>
                <span className="font-mono text-[#222222] truncate block" title={diag.latex.executable_path || ''}>
                  {diag.latex.executable_path || 'Not found'}
                </span>
              </div>
            </div>

            {diag.latex.version_info && (
              <p className="text-[11px] font-mono text-[#666666]">
                Version: {diag.latex.version_info}
              </p>
            )}

            {!diag.latex.available && diag.latex.install_guidance && (
              <div className="p-3 bg-[#F7F7F7] border border-[#b26a00] text-[#b26a00] text-xs rounded-none">
                <span className="font-semibold block mb-0.5">Setup Guidance:</span>
                <p className="leading-relaxed">{diag.latex.install_guidance}</p>
              </div>
            )}
          </div>

          {/* Ollama Local AI Card */}
          <div className="p-4 bg-white border border-[#DEDEDE] space-y-3 rounded-none">
            <div className="flex items-center justify-between border-b border-[#DEDEDE] pb-2">
              <div className="flex items-center gap-2.5">
                <Terminal className="w-4 h-4 text-[#222222]" />
                <div>
                  <h3 className="font-semibold text-[#222222] text-xs">Ollama Local AI</h3>
                  <p className="text-[11px] text-[#666666]">On-device model discovery & inference</p>
                </div>
              </div>
              <span className={`text-[11px] font-mono px-2 py-0.5 border ${diag.ollama.available ? 'bg-[#F7F7F7] border-[#2e7d32] text-[#2e7d32]' : 'bg-[#F7F7F7] border-[#888888] text-[#888888]'}`}>
                {diag.ollama.available ? 'Active' : 'Offline'}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs text-[#444444]">
              <div className="p-2 bg-[#F7F7F7] border border-[#DEDEDE] rounded-none">
                <span className="text-[10px] text-[#666666] uppercase block">Ollama URL</span>
                <span className="font-mono text-[#222222]">{diag.ollama.url}</span>
              </div>
              <div className="p-2 bg-[#F7F7F7] border border-[#DEDEDE] rounded-none">
                <span className="text-[10px] text-[#666666] uppercase block">Models Count</span>
                <span className="font-mono text-[#222222]">{diag.ollama.models_count} model(s) installed</span>
              </div>
            </div>

            {diag.ollama.models && diag.ollama.models.length > 0 && (
              <div className="pt-1">
                <span className="text-[10px] font-mono uppercase text-[#666666] block mb-1">Detected Models:</span>
                <div className="flex flex-wrap gap-1">
                  {diag.ollama.models.map((m: string) => (
                    <span key={m} className="px-1.5 py-0.2 bg-[#F7F7F7] border border-[#DEDEDE] text-[10px] font-mono text-[#222222]">
                      {m}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* SQLite Storage Card */}
          <div className="p-4 bg-white border border-[#DEDEDE] space-y-3 rounded-none">
            <div className="flex items-center justify-between border-b border-[#DEDEDE] pb-2">
              <div className="flex items-center gap-2.5">
                <HardDrive className="w-4 h-4 text-[#222222]" />
                <div>
                  <h3 className="font-semibold text-[#222222] text-xs">Storage & Database</h3>
                  <p className="text-[11px] text-[#666666]">Local SQLite database and workspace artifacts</p>
                </div>
              </div>
              <span className={`text-[11px] font-mono px-2 py-0.5 border ${diag.workspace.is_writable ? 'bg-[#F7F7F7] border-[#2e7d32] text-[#2e7d32]' : 'bg-[#F7F7F7] border-[#c62828] text-[#c62828]'}`}>
                {diag.workspace.is_writable ? 'Writable' : 'Read-only'}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs text-[#444444]">
              <div className="p-2 bg-[#F7F7F7] border border-[#DEDEDE] rounded-none">
                <span className="text-[10px] text-[#666666] uppercase block">Workspace Location</span>
                <span className="font-mono text-[#222222] text-[11px] truncate block" title={diag.workspace.workspace_path}>
                  {diag.workspace.workspace_path}
                </span>
              </div>
              <div className="p-2 bg-[#F7F7F7] border border-[#DEDEDE] rounded-none">
                <span className="text-[10px] text-[#666666] uppercase block">Database Size</span>
                <span className="font-mono text-[#222222] text-[11px]">
                  {(diag.workspace.database_size_bytes / 1024).toFixed(1)} KB
                </span>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
};
