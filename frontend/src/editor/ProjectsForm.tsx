import React from 'react';
import { FolderGit2, Plus, Trash2, ArrowUp, ArrowDown, ExternalLink } from 'lucide-react';
import { ProjectItem } from '../types/resume';
import { TagInput } from '../components/common/TagInput';

interface ProjectsFormProps {
  items: ProjectItem[];
  onChange: (items: ProjectItem[]) => void;
}

export const ProjectsForm: React.FC<ProjectsFormProps> = ({ items, onChange }) => {
  const addProject = () => {
    const newItem: ProjectItem = {
      name: '',
      description: '',
      technologies: [],
      url: '',
      start_date: '',
      end_date: '',
      highlights: ['']
    };
    onChange([newItem, ...items]);
  };

  const updateItem = (index: number, updated: Partial<ProjectItem>) => {
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
            <FolderGit2 className="w-4 h-4 text-[#222222]" />
            Projects & Open Source
          </h3>
          <p className="text-xs text-[#666666] mt-0.5">
            Highlight technical projects showcasing real-world problem solving and core stack mastery.
          </p>
        </div>
        <button
          type="button"
          onClick={addProject}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-[#222222] text-white hover:bg-[#333333] border border-[#222222] transition-colors rounded-none"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Add Project</span>
        </button>
      </div>

      {items.length === 0 ? (
        <div className="text-center py-10 border border-[#DEDEDE] bg-[#F7F7F7] space-y-2">
          <p className="text-xs text-[#666666]">No project entries added yet.</p>
          <button
            type="button"
            onClick={addProject}
            className="text-xs text-[#222222] hover:underline font-medium inline-flex items-center gap-1"
          >
            <Plus className="w-3 h-3" /> Add a project
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
                  Project #{idx + 1}
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
                    title="Delete Project"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Name & Technologies */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-[#666666] mb-1">Project Name *</label>
                  <input
                    type="text"
                    value={item.name || ''}
                    onChange={(e) => updateItem(idx, { name: e.target.value })}
                    placeholder="e.g. Distributed Event Ledger"
                    className="w-full bg-white border border-[#DEDEDE] px-3 py-1.5 text-xs text-[#222222] placeholder-[#888888] focus:outline-none focus:border-[#222222] rounded-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#666666] mb-1">Technologies Used</label>
                  <TagInput
                    items={Array.isArray(item.technologies) ? item.technologies : []}
                    onChange={(techs) => updateItem(idx, { technologies: techs })}
                    placeholder="Type technology and press comma or Enter (e.g. Go, Docker)..."
                    suggestions={['Python', 'TypeScript', 'React', 'Go', 'Docker', 'PostgreSQL', 'AWS', 'Redis', 'GraphQL', 'Kubernetes']}
                  />
                </div>
              </div>

              {/* URL & Timeline */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-[#666666] mb-1">Project URL / Repository</label>
                  <div className="relative">
                    <ExternalLink className="w-3 h-3 text-[#888888] absolute left-2.5 top-2.5" />
                    <input
                      type="text"
                      value={item.url || ''}
                      onChange={(e) => updateItem(idx, { url: e.target.value })}
                      placeholder="https://github.com/user/project"
                      className="w-full bg-white border border-[#DEDEDE] pl-8 pr-3 py-1.5 text-xs text-[#222222] placeholder-[#888888] focus:outline-none focus:border-[#222222] rounded-none"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#666666] mb-1">Timeline / Date</label>
                  <input
                    type="text"
                    value={item.start_date || item.end_date ? `${item.start_date}${item.end_date ? ' - ' + item.end_date : ''}` : ''}
                    onChange={(e) => updateItem(idx, { start_date: e.target.value })}
                    placeholder="e.g. 2023 or Summer 2024"
                    className="w-full bg-white border border-[#DEDEDE] px-3 py-1.5 text-xs text-[#222222] placeholder-[#888888] focus:outline-none focus:border-[#222222] rounded-none"
                  />
                </div>
              </div>

              {/* Highlights */}
              <div className="space-y-2 pt-1">
                <label className="block text-xs font-medium text-[#666666]">
                  Key Technical Features & Outcomes
                </label>

                {(item.highlights || []).map((hl, hIdx) => (
                  <div key={hIdx} className="flex items-center gap-2">
                    <span className="text-[#888888] text-xs">•</span>
                    <input
                      type="text"
                      value={hl}
                      onChange={(e) => updateHighlight(idx, hIdx, e.target.value)}
                      placeholder="e.g. Implemented Raft consensus protocol enabling automated leader failover."
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
