import React, { useEffect, useState } from 'react';
import {
  FileText,
  Cpu,
  Layers,
  Settings,
  Plus,
  HelpCircle
} from 'lucide-react';
import { api } from '../services/api';
import { SystemDiagnostics } from '../types/resume';

interface NavbarProps {
  currentView: string;
  onNavigate: (view: string, resumeId?: string) => void;
  onOpenHelp: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ currentView, onNavigate, onOpenHelp }) => {
  const [diag, setDiag] = useState<SystemDiagnostics | null>(null);

  useEffect(() => {
    api.getDiagnostics()
      .then(setDiag)
      .catch(() => {});
  }, [currentView]);

  return (
    <header className="bg-white border-b border-[#DEDEDE] sticky top-0 z-40 px-4 py-2">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        {/* Brand & Left Navigation */}
        <div className="flex items-center space-x-6">
          <button
            onClick={() => onNavigate('dashboard')}
            className="flex items-center space-x-2 text-left group cursor-pointer focus:outline-none"
          >
            <div className="w-6 h-6 border border-[#222222] bg-[#222222] text-white flex items-center justify-center">
              <FileText className="w-3.5 h-3.5" />
            </div>
            <span className="text-sm font-semibold tracking-tight text-[#222222] flex items-center gap-1.5">
              CVstart
              <span className="text-[10px] font-mono tracking-wider uppercase px-1 py-0.2 border border-[#DEDEDE] text-[#666666] bg-[#F7F7F7]">
                Local
              </span>
            </span>
          </button>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center space-x-0.5">
            <button
              onClick={() => onNavigate('dashboard')}
              className={`px-3 py-1.5 text-xs font-medium transition-colors border ${
                currentView === 'dashboard'
                  ? 'bg-[#EAEAEA] text-[#222222] border-[#DEDEDE]'
                  : 'text-[#666666] hover:text-[#222222] hover:bg-[#F0F0F0] border-transparent'
              }`}
            >
              My Resumes
            </button>
            <button
              onClick={() => onNavigate('templates')}
              className={`px-3 py-1.5 text-xs font-medium transition-colors flex items-center gap-1.5 border ${
                currentView === 'templates'
                  ? 'bg-[#EAEAEA] text-[#222222] border-[#DEDEDE]'
                  : 'text-[#666666] hover:text-[#222222] hover:bg-[#F0F0F0] border-transparent'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              Templates
            </button>
            <button
              onClick={() => onNavigate('models')}
              className={`px-3 py-1.5 text-xs font-medium transition-colors flex items-center gap-1.5 border ${
                currentView === 'models'
                  ? 'bg-[#EAEAEA] text-[#222222] border-[#DEDEDE]'
                  : 'text-[#666666] hover:text-[#222222] hover:bg-[#F0F0F0] border-transparent'
              }`}
            >
              <Cpu className="w-3.5 h-3.5" />
              Models
            </button>
            <button
              onClick={() => onNavigate('diagnostics')}
              className={`px-3 py-1.5 text-xs font-medium transition-colors flex items-center gap-1.5 border ${
                currentView === 'diagnostics'
                  ? 'bg-[#EAEAEA] text-[#222222] border-[#DEDEDE]'
                  : 'text-[#666666] hover:text-[#222222] hover:bg-[#F0F0F0] border-transparent'
              }`}
            >
              <Settings className="w-3.5 h-3.5" />
              Diagnostics
            </button>
          </nav>
        </div>

        {/* Right Status & Primary Action */}
        <div className="flex items-center space-x-3">
          {/* Subtle status indicators */}
          {diag && (
            <div className="hidden lg:flex items-center space-x-3 text-xs text-[#666666]">
              {/* LaTeX status */}
              <div
                className="flex items-center gap-1.5 text-[11px] font-mono"
                title={diag.latex.version_info || diag.latex.error || 'Compiler status'}
              >
                <span className={`w-1.5 h-1.5 ${diag.latex.available ? 'bg-[#2e7d32]' : 'bg-[#b26a00]'}`} />
                <span>LaTeX: {diag.latex.compiler_type || 'Missing'}</span>
              </div>

              <span className="text-[#DEDEDE]">|</span>

              {/* Ollama status */}
              <div
                className="flex items-center gap-1.5 text-[11px] font-mono"
                title={diag.ollama.available ? `Ollama active (${diag.ollama.models_count} models)` : 'Ollama offline'}
              >
                <span className={`w-1.5 h-1.5 ${diag.ollama.available ? 'bg-[#2e7d32]' : 'bg-[#888888]'}`} />
                <span>
                  Ollama: {diag.ollama.available ? `${diag.ollama.models_count} model${diag.ollama.models_count === 1 ? '' : 's'}` : 'Offline'}
                </span>
              </div>
            </div>
          )}

          {/* Help Button */}
          <button
            onClick={onOpenHelp}
            className="p-1.5 text-[#666666] hover:text-[#222222] hover:bg-[#F0F0F0] transition-colors"
            title="Help & About"
          >
            <HelpCircle className="w-4 h-4" />
          </button>

          {/* New Resume Button */}
          <button
            onClick={() => onNavigate('new')}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-[#222222] text-white hover:bg-[#333333] border border-[#222222] transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Resume</span>
          </button>
        </div>
      </div>
    </header>
  );
};
