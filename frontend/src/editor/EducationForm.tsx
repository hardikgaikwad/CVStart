import React from 'react';
import { GraduationCap, Plus, Trash2, ArrowUp, ArrowDown } from 'lucide-react';
import { EducationItem } from '../types/resume';
import { TagInput } from '../components/common/TagInput';

interface EducationFormProps {
  items: EducationItem[];
  onChange: (items: EducationItem[]) => void;
}

export const EducationForm: React.FC<EducationFormProps> = ({ items, onChange }) => {
  const addEducation = () => {
    const newItem: EducationItem = {
      institution: '',
      degree: '',
      field_of_study: '',
      start_date: '',
      end_date: '',
      gpa: '',
      coursework: [],
      highlights: []
    };
    onChange([...items, newItem]);
  };

  const updateItem = (index: number, updated: Partial<EducationItem>) => {
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

  return (
    <div className="space-y-4">
      <div className="border-b border-[#DEDEDE] pb-3 flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-[#222222] flex items-center gap-2">
            <GraduationCap className="w-4 h-4 text-[#222222]" />
            Education
          </h3>
          <p className="text-xs text-[#666666] mt-0.5">
            Degrees, academic honors, GPA, and relevant coursework.
          </p>
        </div>
        <button
          type="button"
          onClick={addEducation}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-[#222222] text-white hover:bg-[#333333] border border-[#222222] transition-colors rounded-none"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Add Education</span>
        </button>
      </div>

      {items.length === 0 ? (
        <div className="text-center py-10 border border-[#DEDEDE] bg-[#F7F7F7] space-y-2">
          <p className="text-xs text-[#666666]">No education entries added yet.</p>
          <button
            type="button"
            onClick={addEducation}
            className="text-xs text-[#222222] hover:underline font-medium inline-flex items-center gap-1"
          >
            <Plus className="w-3 h-3" /> Add education
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
                  Education #{idx + 1}
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
                    title="Delete Education"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Institution & Degree */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-[#666666] mb-1">University / College *</label>
                  <input
                    type="text"
                    value={item.institution || ''}
                    onChange={(e) => updateItem(idx, { institution: e.target.value })}
                    placeholder="e.g. University of Washington"
                    className="w-full bg-white border border-[#DEDEDE] px-3 py-1.5 text-xs text-[#222222] placeholder-[#888888] focus:outline-none focus:border-[#222222] rounded-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#666666] mb-1">Degree & Major *</label>
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="text"
                      value={item.degree || ''}
                      onChange={(e) => updateItem(idx, { degree: e.target.value })}
                      placeholder="e.g. B.S."
                      className="w-full bg-white border border-[#DEDEDE] px-3 py-1.5 text-xs text-[#222222] placeholder-[#888888] focus:outline-none focus:border-[#222222] rounded-none"
                    />
                    <input
                      type="text"
                      value={item.field_of_study || ''}
                      onChange={(e) => updateItem(idx, { field_of_study: e.target.value })}
                      placeholder="e.g. Computer Science"
                      className="w-full bg-white border border-[#DEDEDE] px-3 py-1.5 text-xs text-[#222222] placeholder-[#888888] focus:outline-none focus:border-[#222222] rounded-none"
                    />
                  </div>
                </div>
              </div>

              {/* Dates & GPA */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-medium text-[#666666] mb-1">Start Date</label>
                  <input
                    type="text"
                    value={item.start_date || ''}
                    onChange={(e) => updateItem(idx, { start_date: e.target.value })}
                    placeholder="e.g. 2017"
                    className="w-full bg-white border border-[#DEDEDE] px-3 py-1.5 text-xs text-[#222222] placeholder-[#888888] focus:outline-none focus:border-[#222222] rounded-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#666666] mb-1">End / Graduation Date</label>
                  <input
                    type="text"
                    value={item.end_date || ''}
                    onChange={(e) => updateItem(idx, { end_date: e.target.value })}
                    placeholder="e.g. May 2021"
                    className="w-full bg-white border border-[#DEDEDE] px-3 py-1.5 text-xs text-[#222222] placeholder-[#888888] focus:outline-none focus:border-[#222222] rounded-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#666666] mb-1">GPA (optional)</label>
                  <input
                    type="text"
                    value={item.gpa || ''}
                    onChange={(e) => updateItem(idx, { gpa: e.target.value })}
                    placeholder="e.g. 3.85 / 4.0"
                    className="w-full bg-white border border-[#DEDEDE] px-3 py-1.5 text-xs text-[#222222] placeholder-[#888888] focus:outline-none focus:border-[#222222] rounded-none"
                  />
                </div>
              </div>

              {/* Coursework */}
              <div>
                <label className="block text-xs font-medium text-[#666666] mb-1">Relevant Coursework</label>
                <TagInput
                  items={Array.isArray(item.coursework) ? item.coursework : []}
                  onChange={(courses) => updateItem(idx, { coursework: courses })}
                  placeholder="Type course and press comma or Enter (e.g. Data Structures, Algorithms)..."
                  suggestions={['Data Structures', 'Algorithms', 'Distributed Systems', 'Operating Systems', 'Database Systems', 'Computer Networks', 'Machine Learning', 'Artificial Intelligence', 'Software Engineering', 'Compilers']}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
