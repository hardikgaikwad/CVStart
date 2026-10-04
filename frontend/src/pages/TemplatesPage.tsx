import React from 'react';
import { Layers, Check, ArrowRight } from 'lucide-react';

interface TemplatesPageProps {
  onSelectTemplate?: (templateId: string) => void;
  onNavigate: (view: string) => void;
}

export const TemplatesPage: React.FC<TemplatesPageProps> = ({ onNavigate }) => {
  const templates = [
    {
      id: 'modern_technical',
      name: 'Modern Technical',
      tagline: 'Single-Column ATS-Optimized Technical Standard',
      description: 'Clean hierarchy, subtle rules, modern typography, and clickable contact hyperlinks. Ideal for Software Engineers, Architects, and Tech Leads.',
      features: ['100% ATS Friendly', 'Monochrome & Subtle Grays', 'Optimized Margins', 'Compact Bullet Separation'],
      badge: 'Standard'
    },
    {
      id: 'minimalist',
      name: 'Minimalist 1-Page',
      tagline: 'High-Density Monochrome Precision',
      description: 'Strict monochrome styling with tight spacing, bold headers, and high information density. Engineered specifically to pack comprehensive technical experience into a single page.',
      features: ['High Information Density', 'Pure Monochrome', 'Maximum Space Efficiency', 'Strict Page Budget'],
      badge: 'Single-Page'
    },
    {
      id: 'executive',
      name: 'Executive Serif',
      tagline: 'Distinguished Leadership & Engineering Management',
      description: 'Small-caps section headings and refined font hierarchy for Senior Directors, Engineering Managers, and Principal Architects.',
      features: ['Small-Caps Headings', 'Refined Margins', 'Leadership Spacing', 'Prestigious Hierarchy'],
      badge: 'Executive'
    }
  ];

  return (
    <div className="max-w-6xl mx-auto px-6 py-8 space-y-6 w-full">
      <div className="border-b border-[#DEDEDE] pb-4">
        <h1 className="text-xl font-semibold text-[#222222] tracking-tight flex items-center gap-2">
          <Layers className="w-5 h-5 text-[#222222]" />
          LaTeX Resume Templates
        </h1>
        <p className="text-xs text-[#666666] mt-0.5">
          Templates are compiled using local LaTeX, ATS-parser compliant, and support both Letter and A4 page dimensions.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {templates.map((tpl) => (
          <div
            key={tpl.id}
            className="bg-white border border-[#DEDEDE] p-5 flex flex-col justify-between space-y-5 rounded-none"
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between border-b border-[#DEDEDE] pb-2">
                <span className="text-[10px] font-mono uppercase tracking-wider px-1.5 py-0.5 bg-[#F7F7F7] border border-[#DEDEDE] text-[#666666]">
                  {tpl.badge}
                </span>
                <span className="text-[10px] font-mono text-[#888888]">Native LaTeX</span>
              </div>

              <div>
                <h3 className="text-sm font-semibold text-[#222222]">
                  {tpl.name}
                </h3>
                <p className="text-xs text-[#666666] mt-0.5">{tpl.tagline}</p>
              </div>

              <p className="text-xs text-[#444444] leading-relaxed">
                {tpl.description}
              </p>

              <div className="space-y-1.5 pt-2 border-t border-[#DEDEDE]">
                <span className="text-[10px] font-mono text-[#666666] uppercase tracking-wider block">
                  Layout Highlights:
                </span>
                <ul className="space-y-1 text-xs text-[#444444]">
                  {tpl.features.map((feat, i) => (
                    <li key={i} className="flex items-center gap-1.5">
                      <Check className="w-3.5 h-3.5 text-[#222222] shrink-0" />
                      <span>{feat}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <button
              onClick={() => onNavigate('dashboard')}
              className="w-full py-2 bg-[#222222] hover:bg-[#333333] text-white text-xs font-medium border border-[#222222] transition-colors flex items-center justify-center gap-1.5 rounded-none cursor-pointer"
            >
              <span>Select in Resumes</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};
