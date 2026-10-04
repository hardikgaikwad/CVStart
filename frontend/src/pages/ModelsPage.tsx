import React, { useState, useEffect } from 'react';
import {
  Cpu,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  Terminal,
  Copy,
  Check
} from 'lucide-react';
import { api } from '../services/api';
import { OllamaModelInfo } from '../types/resume';

export const ModelsPage: React.FC = () => {
  const [loading, setLoading] = useState<boolean>(true);
  const [reachable, setReachable] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [models, setModels] = useState<OllamaModelInfo[]>([]);
  const [defaultModel, setDefaultModel] = useState<string>('');
  const [copiedCmd, setCopiedCmd] = useState<string | null>(null);

  const fetchModels = async () => {
    setLoading(true);
    try {
      const res = await api.listModels();
      setReachable(res.ollama_reachable);
      setModels(res.models);
      setDefaultModel(res.default_model);
      setErrorMsg(res.ollama_error || null);
    } catch (e: any) {
      setReachable(false);
      setErrorMsg(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchModels();
  }, []);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCmd(text);
    setTimeout(() => setCopiedCmd(null), 2000);
  };

  const sampleModels = [
    { name: 'llama3.2', desc: 'Fast, highly capable modern 3B model (Recommended default)', command: 'ollama run llama3.2' },
    { name: 'llama3.2-vision', desc: 'Multimodal vision model for visual PDF layout inspection', command: 'ollama run llama3.2-vision' },
    { name: 'mistral', desc: 'Versatile 7B model with strong instruction following', command: 'ollama run mistral' },
    { name: 'qwen2.5', desc: 'High-precision technical reasoning and structured JSON output', command: 'ollama run qwen2.5' },
  ];

  return (
    <div className="max-w-5xl mx-auto px-6 py-8 space-y-6 w-full">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#DEDEDE] pb-4">
        <div>
          <h1 className="text-xl font-semibold text-[#222222] tracking-tight flex items-center gap-2">
            <Cpu className="w-5 h-5 text-[#222222]" />
            Local Model Settings
          </h1>
          <p className="text-xs text-[#666666] mt-0.5">
            CVstart uses open-weight AI models via Ollama running entirely on your local machine.
          </p>
        </div>

        <button
          onClick={fetchModels}
          disabled={loading}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-white hover:bg-[#F0F0F0] text-[#222222] border border-[#DEDEDE] transition-colors disabled:opacity-40 rounded-none cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh Models</span>
        </button>
      </div>

      {/* Connection Status Box */}
      <div className="p-4 border border-[#DEDEDE] bg-[#F7F7F7] flex items-start gap-3 rounded-none">
        {reachable ? (
          <CheckCircle2 className="w-4 h-4 text-[#2e7d32] shrink-0 mt-0.5" />
        ) : (
          <AlertTriangle className="w-4 h-4 text-[#b26a00] shrink-0 mt-0.5" />
        )}
        <div className="space-y-0.5 text-xs">
          <h3 className="font-semibold text-[#222222]">
            {reachable ? 'Ollama Server Active' : 'Ollama Offline or Unreachable'}
          </h3>
          <p className="text-[#666666] leading-relaxed">
            {reachable
              ? `Connected at http://127.0.0.1:11434 with ${models.length} model(s) installed.`
              : 'Make sure Ollama is installed and running locally via `ollama serve`.'}
          </p>
          {errorMsg && (
            <p className="text-[#c62828] font-mono text-[11px] pt-1">{errorMsg}</p>
          )}
        </div>
      </div>

      {/* Installed Models Section */}
      <div className="space-y-3">
        <h2 className="text-xs font-semibold text-[#222222] uppercase tracking-wider">
          Installed Models ({models.length})
        </h2>

        {models.length === 0 ? (
          <div className="p-6 border border-[#DEDEDE] bg-white text-center space-y-2 rounded-none">
            <Terminal className="w-8 h-8 text-[#888888] mx-auto" />
            <p className="text-xs text-[#666666]">No models currently installed in local Ollama.</p>
            <p className="text-[11px] text-[#888888]">Run one of the commands below to download an open-weight model.</p>
          </div>
        ) : (
          <div className="border border-[#DEDEDE] bg-white overflow-x-auto rounded-none">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-[#DEDEDE] bg-[#F7F7F7] text-[#666666]">
                  <th className="py-2 px-3 font-medium">Model Name</th>
                  <th className="py-2 px-3 font-medium">Size</th>
                  <th className="py-2 px-3 font-medium">Family</th>
                  <th className="py-2 px-3 font-medium">Capabilities</th>
                  <th className="py-2 px-3 font-medium text-right">Default</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#DEDEDE]">
                {models.map((m) => (
                  <tr key={m.name} className="hover:bg-[#F7F7F7]">
                    <td className="py-2.5 px-3 font-medium text-[#222222] font-mono">
                      {m.name}
                    </td>
                    <td className="py-2.5 px-3 text-[#666666] font-mono">
                      {(m.size_bytes / (1024 * 1024 * 1024)).toFixed(1)} GB
                    </td>
                    <td className="py-2.5 px-3 text-[#666666] capitalize">
                      {m.family || 'LLM'}
                    </td>
                    <td className="py-2.5 px-3 text-[#666666]">
                      <div className="flex items-center gap-1.5">
                        {m.supports_vision && (
                          <span className="px-1.5 py-0.2 bg-[#F7F7F7] border border-[#DEDEDE] text-[10px] font-mono">
                            Vision
                          </span>
                        )}
                        <span className="px-1.5 py-0.2 bg-[#F7F7F7] border border-[#DEDEDE] text-[10px] font-mono">
                          Text
                        </span>
                      </div>
                    </td>
                    <td className="py-2.5 px-3 text-right">
                      {defaultModel === m.name ? (
                        <span className="text-[11px] font-medium text-[#2e7d32]">Default</span>
                      ) : (
                        <span className="text-[11px] text-[#888888]">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Suggested Models & Terminal Commands */}
      <div className="space-y-3 pt-2">
        <h2 className="text-xs font-semibold text-[#222222] uppercase tracking-wider">
          Recommended Local Models
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {sampleModels.map((item) => (
            <div
              key={item.name}
              className="bg-white border border-[#DEDEDE] p-3.5 space-y-2 rounded-none"
            >
              <div>
                <h4 className="text-xs font-semibold text-[#222222] font-mono">{item.name}</h4>
                <p className="text-[11px] text-[#666666] mt-0.5">{item.desc}</p>
              </div>

              <div className="flex items-center justify-between bg-[#F7F7F7] border border-[#DEDEDE] px-2.5 py-1 rounded-none">
                <code className="text-[11px] font-mono text-[#222222]">{item.command}</code>
                <button
                  onClick={() => copyToClipboard(item.command)}
                  className="p-1 text-[#666666] hover:text-[#222222] transition-colors"
                  title="Copy command"
                >
                  {copiedCmd === item.command ? (
                    <Check className="w-3.5 h-3.5 text-[#2e7d32]" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
