import React from 'react';
import { Briefcase, Plus, Trash2, ArrowUp, ArrowDown } from 'lucide-react';
import { ExperienceItem } from '../types/resume';

interface ExperienceFormProps {
  items: ExperienceItem[];
  onChange: (items: ExperienceItem[]) => void;
  onAskAi: (prompt: string) => void;
}

export const ExperienceForm: React.FC<ExperienceFormProps> = ({ items, onChange, onAskAi }) => {
  const addExperience = () => {
    const newItem: ExperienceItem = {
      company: '',
      role: '',
      location: '',
      start_date: '',
      end_date: '',
      current: false,
      description: '',
      highlights: ['']
    };
    onChange([newItem, ...items]);
  };

  const updateItem = (index: number, updated: Partial<ExperienceItem>) => {
    const copy = [...items];
    copy[index] = { ...copy[index], ...updated };
    onChange(copy);
  };

  const removeItem = (index: number) => {
    onChange(items.filter((_, i) => i !== index));
  };

  const moveItem = (index: number, direction: 'up' | 'down') => {
    const target = direction === 'up' ? index - 1 : index + 1;
    if (target < 0 || target >= items.length) return;
    const copy = [...items];
    const temp = copy[index];
    copy[index] = copy[target];
    copy[target] = temp;
    onChange(copy);
  };

  const addHighlight = (itemIndex: number) => {
    const copy = [...items];
    copy[itemIndex].highlights = [...(copy[itemIndex].highlights || []), ''];
    onChange(copy);
  };

  const updateHighlight = (itemIndex: number, hlIndex: number, value: string) => {
    const copy = [...items];
    const hls = [...(copy[itemIndex].highlights || [])];
    hls[hlIndex] = value;
    copy[itemIndex].highlights = hls;
    onChange(copy);
  };

  const removeHighlight = (itemIndex: number, hlIndex: number) => {
    const copy = [...items];
    copy[itemIndex].highlights = copy[itemIndex].highlights.filter((_, i) => i !== hlIndex);
    onChange(copy);
  };

  return (
    <div className="space-y-4">
      <div className="border-b border-[#DEDEDE] pb-3 flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-[#222222] flex items-center gap-2">
            <Briefcase className="w-4 h-4 text-[#222222]" />
            Work Experience
          </h3>
          <p className="text-xs text-[#666666] mt-0.5">
            List your relevant roles in reverse chronological order. Focus on measurable achievements.
          </p>
        </div>
        <button
          type="button"
          onClick={addExperience}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-[#222222] text-white hover:bg-[#333333] border border-[#222222] transition-colors rounded-none"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Add Position</span>
        </button>
      </div>

      {items.length === 0 ? (
        <div className="text-center py-10 border border-[#DEDEDE] bg-[#F7F7F7] space-y-2">
          <p className="text-xs text-[#666666]">No work experience entries added yet.</p>
          <button
            type="button"
            onClick={addExperience}
            className="text-xs text-[#222222] hover:underline font-medium inline-flex items-center gap-1"
          >
            <Plus className="w-3 h-3" /> Add your first position
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {items.map((item, idx) => (
            <div
              key={idx}
              className="bg-white border border-[#DEDEDE] p-4 space-y-3 rounded-none"
            >
              {/* Header */}
              <div className="flex items-center justify-between border-b border-[#DEDEDE] pb-2">
                <span className="text-[11px] font-mono uppercase tracking-wider text-[#666666]">
                  Position #{idx + 1}
                </span>
                <div className="flex items-center space-x-1">
                  <button
                    type="button"
                    onClick={() => moveItem(idx, 'up')}
                    disabled={idx === 0}
                    className="p-1 text-[#666666] hover:text-[#222222] disabled:opacity-30 border border-[#DEDEDE] hover:bg-[#F0F0F0] rounded-none transition-colors"
                    title="Move Up"
                  >
                    <ArrowUp className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => moveItem(idx, 'down')}
                    disabled={idx === items.length - 1}
                    className="p-1 text-[#666666] hover:text-[#222222] disabled:opacity-30 border border-[#DEDEDE] hover:bg-[#F0F0F0] rounded-none transition-colors"
                    title="Move Down"
                  >
                    <ArrowDown className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => removeItem(idx)}
                    className="p-1 text-[#888888] hover:text-[#c62828] border border-[#DEDEDE] hover:bg-[#F0F0F0] rounded-none transition-colors ml-1"
                    title="Delete Position"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Company & Role */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-[#666666] mb-1">Company / Organization *</label>
                  <input
                    type="text"
                    value={item.company || ''}
                    onChange={(e) => updateItem(idx, { company: e.target.value })}
                    placeholder="e.g. Apex Systems"
                    className="w-full bg-white border border-[#DEDEDE] px-3 py-1.5 text-xs text-[#222222] placeholder-[#888888] focus:outline-none focus:border-[#222222] rounded-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#666666] mb-1">Job Title / Role *</label>
                  <input
                    type="text"
                    value={item.role || ''}
                    onChange={(e) => updateItem(idx, { role: e.target.value })}
                    placeholder="e.g. Lead Backend Engineer"
                    className="w-full bg-white border border-[#DEDEDE] px-3 py-1.5 text-xs text-[#222222] placeholder-[#888888] focus:outline-none focus:border-[#222222] rounded-none"
                  />
                </div>
              </div>

              {/* Dates & Location */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-medium text-[#666666] mb-1">Location</label>
                  <input
                    type="text"
                    value={item.location || ''}
                    onChange={(e) => updateItem(idx, { location: e.target.value })}
                    placeholder="e.g. Seattle, WA (Remote)"
                    className="w-full bg-white border border-[#DEDEDE] px-3 py-1.5 text-xs text-[#222222] placeholder-[#888888] focus:outline-none focus:border-[#222222] rounded-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#666666] mb-1">Start Date</label>
                  <input
                    type="text"
                    value={item.start_date || ''}
                    onChange={(e) => updateItem(idx, { start_date: e.target.value })}
                    placeholder="e.g. Jan 2021"
                    className="w-full bg-white border border-[#DEDEDE] px-3 py-1.5 text-xs text-[#222222] placeholder-[#888888] focus:outline-none focus:border-[#222222] rounded-none"
                  />
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-medium text-[#666666]">End Date</label>
                    <label className="flex items-center gap-1 text-xs text-[#666666] cursor-pointer">
                      <input
                        type="checkbox"
                        checked={item.current || false}
                        onChange={(e) => updateItem(idx, { current: e.target.checked, end_date: e.target.checked ? 'Present' : '' })}
                        className="rounded-none border-[#DEDEDE] text-[#222222]"
                      />
                      <span>Present</span>
                    </label>
                  </div>
                  <input
                    type="text"
                    disabled={item.current}
                    value={item.current ? 'Present' : (item.end_date || '')}
                    onChange={(e) => updateItem(idx, { end_date: e.target.value })}
                    placeholder="e.g. Present or Dec 2023"
                    className="w-full bg-white border border-[#DEDEDE] px-3 py-1.5 text-xs text-[#222222] placeholder-[#888888] focus:outline-none focus:border-[#222222] disabled:bg-[#F7F7F7] disabled:text-[#888888] rounded-none"
                  />
                </div>
              </div>

              {/* Bullet Points */}
              <div className="space-y-2 pt-1">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-medium text-[#666666]">
                    Key Accomplishments / Responsibilities
                  </label>
                  <button
                    type="button"
                    onClick={() => onAskAi(`Strengthen action verbs and metrics for my role at ${item.company || 'my job'}.`)}
                    className="text-[11px] text-[#222222] hover:underline font-medium"
                  >
                    Polish bullets
                  </button>
                </div>

                {(item.highlights || []).map((hl, hIdx) => (
                  <div key={hIdx} className="flex items-center gap-2">
                    <span className="text-[#888888] text-xs">•</span>
                    <input
                      type="text"
                      value={hl}
                      onChange={(e) => updateHighlight(idx, hIdx, e.target.value)}
                      placeholder="e.g. Architected streaming ingestion pipeline processing 250M daily events with 99.99% uptime."
                      className="flex-1 bg-white border border-[#DEDEDE] px-3 py-1.5 text-xs text-[#222222] placeholder-[#888888] focus:outline-none focus:border-[#222222] rounded-none"
                    />
                    <button
                      type="button"
                      onClick={() => removeHighlight(idx, hIdx)}
                      className="text-[#888888] hover:text-[#c62828] p-1 border border-[#DEDEDE] hover:bg-[#F0F0F0] rounded-none transition-colors"
                      title="Remove bullet"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}

                <button
                  type="button"
                  onClick={() => addHighlight(idx)}
                  className="inline-flex items-center gap-1 text-xs text-[#222222] hover:underline font-medium pt-1"
                >
                  <Plus className="w-3 h-3" /> Add bullet point
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
