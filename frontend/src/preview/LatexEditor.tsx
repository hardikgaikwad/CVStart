import React, { useState } from 'react';
import { Copy, Check, RotateCcw, Download, CheckCircle, AlertCircle, FileCode } from 'lucide-react';
import { api } from '../services/api';

interface LatexEditorProps {
  latexSource: string;
  onChange: (newSource: string) => void;
  onRestore: () => void;
  resumeId: string;
}

export const LatexEditor: React.FC<LatexEditorProps> = ({
  latexSource,
  onChange,
  onRestore,
  resumeId
}) => {
  const [copied, setCopied] = useState<boolean>(false);
  const [validationResult, setValidationResult] = useState<{ valid: boolean; errors: string[] } | null>(null);
  const [isValidating, setIsValidating] = useState<boolean>(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(latexSource);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const validateCode = async () => {
    setIsValidating(true);
    try {
      const res = await api.validateLatex(latexSource);
      setValidationResult(res);
    } catch (e: any) {
      setValidationResult({ valid: false, errors: [e.message] });
    } finally {
      setIsValidating(false);
    }
  };

  const lines = latexSource.split('\n');

  return (
    <div className="flex flex-col h-full bg-white border border-[#DEDEDE] overflow-hidden rounded-none">
      {/* Top Toolbar */}
      <div className="flex items-center justify-between px-3 py-2 bg-white border-b border-[#DEDEDE] text-xs shrink-0">
        <div className="flex items-center space-x-2">
          <span className="font-semibold text-[#222222] flex items-center gap-1.5">
            <FileCode className="w-3.5 h-3.5 text-[#222222]" />
            LaTeX Source Editor
          </span>
          <span className="text-[11px] font-mono text-[#888888]">
            ({lines.length} lines)
          </span>
        </div>

        <div className="flex items-center space-x-1.5">
          {/* Validate */}
          <button
            onClick={validateCode}
            disabled={isValidating}
            className="px-2.5 py-1 text-[#222222] hover:bg-[#F0F0F0] border border-[#DEDEDE] bg-white transition-colors rounded-none"
            title="Check syntax and safety constraints"
          >
            {isValidating ? 'Validating...' : 'Validate'}
          </button>

          {/* Revert / Restore */}
          <button
            onClick={onRestore}
            className="p-1 text-[#666666] hover:text-[#222222] border border-[#DEDEDE] bg-white hover:bg-[#F0F0F0] rounded-none transition-colors"
            title="Revert to last generated version"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>

          {/* Copy */}
          <button
            onClick={handleCopy}
            className="p-1 text-[#666666] hover:text-[#222222] border border-[#DEDEDE] bg-white hover:bg-[#F0F0F0] rounded-none transition-colors"
            title="Copy LaTeX source"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-[#2e7d32]" /> : <Copy className="w-3.5 h-3.5" />}
          </button>

          {/* Download .tex */}
          <a
            href={api.getExportUrl(resumeId, 'tex')}
            download
            className="p-1 text-[#666666] hover:text-[#222222] border border-[#DEDEDE] bg-white hover:bg-[#F0F0F0] rounded-none transition-colors inline-block"
            title="Download .tex file"
          >
            <Download className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>

      {/* Validation Banner */}
      {validationResult && (
        <div
          className={`px-3 py-2 text-xs flex items-center justify-between border-b ${
            validationResult.valid
              ? 'bg-[#F7F7F7] border-[#DEDEDE] text-[#2e7d32]'
              : 'bg-[#F7F7F7] border-[#c62828] text-[#c62828]'
          }`}
        >
          <div className="flex items-center gap-1.5 font-mono text-[11px]">
            {validationResult.valid ? (
              <>
                <CheckCircle className="w-3.5 h-3.5 text-[#2e7d32] shrink-0" />
                <span>LaTeX syntax & security checks passed.</span>
              </>
            ) : (
              <>
                <AlertCircle className="w-3.5 h-3.5 text-[#c62828] shrink-0" />
                <span>{validationResult.errors.join('; ')}</span>
              </>
            )}
          </div>
          <button
            onClick={() => setValidationResult(null)}
            className="text-[#666666] hover:text-[#222222] text-[11px]"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Editor Body with Monochromatic Line Numbers */}
      <div className="flex-1 flex overflow-hidden font-mono text-xs leading-5">
        {/* Line Numbers */}
        <div className="w-12 bg-[#F7F7F7] text-[#888888] select-none py-3 text-right pr-3 border-r border-[#DEDEDE] overflow-hidden shrink-0">
          {lines.map((_, i) => (
            <div key={i}>{i + 1}</div>
          ))}
        </div>

        {/* Text Area */}
        <textarea
          value={latexSource}
          onChange={(e) => onChange(e.target.value)}
          spellCheck={false}
          className="flex-1 bg-white text-[#222222] p-3 resize-none focus:outline-none focus:ring-0 overflow-auto whitespace-pre font-mono leading-5 selection:bg-[#EAEAEA]"
          placeholder="% Paste or edit LaTeX source here..."
        />
      </div>
    </div>
  );
};
