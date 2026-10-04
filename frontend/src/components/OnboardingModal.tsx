import React from 'react';
import { X, ShieldCheck, Cpu, RefreshCw, FileCode, Check } from 'lucide-react';

interface OnboardingModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const OnboardingModal: React.FC<OnboardingModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/30 flex items-center justify-center p-4">
      <div className="bg-white border border-[#DEDEDE] max-w-lg w-full p-6 shadow-sm relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-[#888888] hover:text-[#222222] p-1 transition-colors"
          title="Close"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex items-center gap-2.5 mb-3 border-b border-[#DEDEDE] pb-3">
          <div className="w-7 h-7 bg-[#222222] text-white flex items-center justify-center">
            <FileCode className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-[#222222]">Welcome to CVstart</h2>
            <p className="text-xs text-[#666666]">Local-First, AI-Powered Agentic LaTeX Resume Builder</p>
          </div>
        </div>

        <p className="text-xs text-[#444444] mb-5 leading-relaxed">
          CVstart gives you the typographic precision and layout quality of native LaTeX without requiring you to write code.
          All model inference and document compilation execute entirely on your local machine.
        </p>

        <div className="space-y-3 mb-6">
          <div className="flex items-start gap-3 p-3 bg-[#F7F7F7] border border-[#DEDEDE]">
            <ShieldCheck className="w-4 h-4 text-[#222222] shrink-0 mt-0.5" />
            <div>
              <h4 className="text-xs font-semibold text-[#222222]">100% Local Privacy</h4>
              <p className="text-[11px] text-[#666666] mt-0.5">
                Resume data is persisted in a local SQLite database. No analytics, tracking, or cloud dependencies.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3 p-3 bg-[#F7F7F7] border border-[#DEDEDE]">
            <Cpu className="w-4 h-4 text-[#222222] shrink-0 mt-0.5" />
            <div>
              <h4 className="text-xs font-semibold text-[#222222]">Local Ollama Intelligence</h4>
              <p className="text-[11px] text-[#666666] mt-0.5">
                Utilizes local open-weight language models (Llama 3.2, Mistral, Qwen) for structured editing.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3 p-3 bg-[#F7F7F7] border border-[#DEDEDE]">
            <RefreshCw className="w-4 h-4 text-[#222222] shrink-0 mt-0.5" />
            <div>
              <h4 className="text-xs font-semibold text-[#222222]">Agentic Layout Inspection</h4>
              <p className="text-[11px] text-[#666666] mt-0.5">
                Compiles the document, analyzes text bounding boxes and margins via PyMuPDF, and tunes spacing iteratively.
              </p>
            </div>
          </div>
        </div>

        <div className="flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-[#222222] hover:bg-[#333333] text-white text-xs font-medium border border-[#222222] transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <Check className="w-3.5 h-3.5" />
            <span>Continue to Editor</span>
          </button>
        </div>
      </div>
    </div>
  );
};
