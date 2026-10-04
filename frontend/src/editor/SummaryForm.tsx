import React from 'react';
import { AlignLeft } from 'lucide-react';

interface SummaryFormProps {
  summary: string;
  onChange: (value: string) => void;
  onAskAi: (prompt: string) => void;
}

export const SummaryForm: React.FC<SummaryFormProps> = ({ summary, onChange, onAskAi }) => {
  const wordCount = summary ? summary.trim().split(/\s+/).filter(Boolean).length : 0;

  return (
    <div className="space-y-4">
      <div className="border-b border-[#DEDEDE] pb-3 mb-4 flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-[#222222] flex items-center gap-2">
            <AlignLeft className="w-4 h-4 text-[#222222]" />
            Professional Summary
          </h3>
          <p className="text-xs text-[#666666] mt-0.5">
            A concise 2-4 sentence overview of your career accomplishments and core value proposition.
          </p>
        </div>
        <button
          type="button"
          onClick={() => onAskAi("Rewrite my professional summary to be high-impact, active, and focused for my target role.")}
          className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium bg-white text-[#222222] border border-[#DEDEDE] hover:bg-[#F0F0F0] transition-colors rounded-none"
        >
          <span>Polish Summary</span>
        </button>
      </div>

      <div>
        <textarea
          rows={6}
          value={summary || ''}
          onChange={(e) => onChange(e.target.value)}
          placeholder="e.g. Results-driven Software Architect with 8+ years of experience designing fault-tolerant distributed cloud infrastructure, microservices, and high-throughput data processing pipelines..."
          className="w-full bg-white border border-[#DEDEDE] p-3 text-xs text-[#222222] placeholder-[#888888] focus:outline-none focus:border-[#222222] leading-relaxed rounded-none"
        />
        <div className="flex items-center justify-between mt-1 text-[11px] text-[#666666]">
          <span>Target length: 40–80 words</span>
          <span className={wordCount > 90 ? 'text-[#b26a00] font-medium' : ''}>
            {wordCount} words
          </span>
        </div>
      </div>
    </div>
  );
};
