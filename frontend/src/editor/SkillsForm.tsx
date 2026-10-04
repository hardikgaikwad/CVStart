import React, { useState } from 'react';
import { Wrench, Plus, Trash2, Tag } from 'lucide-react';
import { TechnicalSkills } from '../types/resume';
import { TagInput } from '../components/common/TagInput';

interface SkillsFormProps {
  skills: TechnicalSkills;
  onChange: (skills: TechnicalSkills) => void;
}

export const SkillsForm: React.FC<SkillsFormProps> = ({ skills, onChange }) => {
  const [newCatName, setNewCatName] = useState('');
  const [showAddCat, setShowAddCat] = useState(false);

  // Standard category definitions with suggestions
  const defaultCategories: Record<string, { label: string; placeholder: string; suggestions: string[] }> = {
    languages: {
      label: 'Programming Languages',
      placeholder: 'Type a language and press comma or Enter (e.g. Python, TypeScript)...',
      suggestions: ['Python', 'TypeScript', 'JavaScript', 'Go', 'Rust', 'C++', 'Java', 'SQL', 'Bash', 'HTML/CSS']
    },
    frameworks: {
      label: 'Frameworks & Runtimes',
      placeholder: 'Type a framework and press comma or Enter (e.g. Django, React)...',
      suggestions: ['Django', 'FastAPI', 'React', 'Node.js', 'Next.js', 'Vue', 'Express', 'Spring Boot', 'Flask', 'PyTorch']
    },
    developer_tools: {
      label: 'Developer Tools & Cloud',
      placeholder: 'Type a tool and press comma or Enter (e.g. Docker, AWS)...',
      suggestions: ['Docker', 'Kubernetes', 'AWS', 'Git', 'Linux', 'Terraform', 'CI/CD', 'GitHub Actions', 'GCP', 'Azure']
    },
    libraries: {
      label: 'Libraries & Databases',
      placeholder: 'Type a library/database and press comma or Enter (e.g. PostgreSQL, Redis)...',
      suggestions: ['PostgreSQL', 'Redis', 'MongoDB', 'GraphQL', 'Celery', 'Pandas', 'Kafka', 'Elasticsearch', 'RabbitMQ', 'MySQL']
    }
  };

  const allCategoryKeys = Array.from(
    new Set([
      'languages',
      'frameworks',
      'developer_tools',
      'libraries',
      ...Object.keys(skills || {})
    ])
  );

  const updateCategoryItems = (key: string, items: string[]) => {
    onChange({
      ...skills,
      [key]: items
    });
  };

  const handleAddCategory = (name: string) => {
    const trimmed = name.trim();
    if (!trimmed) return;
    const key = trimmed.toLowerCase().replace(/[^a-z0-9]+/g, '_');

    if (!skills[key]) {
      onChange({
        ...skills,
        [key]: []
      });
    }
    setNewCatName('');
    setShowAddCat(false);
  };

  const removeCategory = (key: string) => {
    const updated = { ...skills };
    delete updated[key];
    onChange(updated);
  };

  const totalSkillsCount = Object.values(skills || {}).reduce(
    (acc, list) => acc + (Array.isArray(list) ? list.length : 0),
    0
  );

  const categoryPresets = [
    'Cloud Platforms',
    'Databases & Storage',
    'DevOps & CI/CD',
    'Machine Learning & AI',
    'Testing & QA',
    'Operating Systems',
    'Architecture & Methodologies'
  ];

  return (
    <div className="space-y-4">
      <div className="border-b border-[#DEDEDE] pb-3 flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-[#222222] flex items-center gap-2">
            <Wrench className="w-4 h-4 text-[#222222]" />
            Technical Skills & Technologies
          </h3>
          <p className="text-xs text-[#666666] mt-0.5">
            Add skills by typing and pressing <kbd className="px-1 py-0.5 bg-[#F7F7F7] border border-[#DEDEDE] text-[#222222] font-mono text-[10px]">comma ,</kbd> or <kbd className="px-1 py-0.5 bg-[#F7F7F7] border border-[#DEDEDE] text-[#222222] font-mono text-[10px]">Enter ↵</kbd>, or paste comma-separated text.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono text-[#666666] bg-[#F7F7F7] px-2 py-1 border border-[#DEDEDE]">
            {totalSkillsCount} total skill{totalSkillsCount === 1 ? '' : 's'}
          </span>
          <button
            type="button"
            onClick={() => setShowAddCat(!showAddCat)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-[#222222] text-white hover:bg-[#333333] border border-[#222222] transition-colors rounded-none"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Category</span>
          </button>
        </div>
      </div>

      {/* Add Category Dialog */}
      {showAddCat && (
        <div className="bg-[#F7F7F7] border border-[#DEDEDE] p-3.5 space-y-3 rounded-none">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-semibold text-[#222222] flex items-center gap-1.5">
              <Tag className="w-3.5 h-3.5 text-[#666666]" />
              Create New Skills Category
            </h4>
            <button
              type="button"
              onClick={() => setShowAddCat(false)}
              className="text-[#888888] hover:text-[#222222] text-xs"
            >
              ✕
            </button>
          </div>

          <div className="flex gap-2">
            <input
              type="text"
              value={newCatName}
              onChange={(e) => setNewCatName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleAddCategory(newCatName);
                }
              }}
              placeholder="e.g. Cloud Platforms, Testing & QA..."
              className="flex-1 bg-white border border-[#DEDEDE] px-3 py-1.5 text-xs text-[#222222] placeholder-[#888888] focus:outline-none focus:border-[#222222] rounded-none"
            />
            <button
              type="button"
              onClick={() => handleAddCategory(newCatName)}
              disabled={!newCatName.trim()}
              className="px-3.5 py-1.5 text-xs font-medium bg-[#222222] hover:bg-[#333333] disabled:opacity-40 text-white border border-[#222222] transition-colors rounded-none"
            >
              Add
            </button>
          </div>

          <div className="space-y-1">
            <span className="text-[10px] text-[#888888]">Quick presets:</span>
            <div className="flex flex-wrap gap-1.5">
              {categoryPresets.map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => handleAddCategory(preset)}
                  className="px-2 py-0.5 bg-white hover:bg-[#EAEAEA] border border-[#DEDEDE] text-[11px] text-[#444444] transition-colors rounded-none"
                >
                  + {preset}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Categories List */}
      <div className="space-y-3">
        {allCategoryKeys.map((catKey) => {
          const currentItems = Array.isArray(skills[catKey]) ? skills[catKey] : [];
          const defaultDef = defaultCategories[catKey];
          const displayLabel = defaultDef?.label || catKey.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
          const isStandard = ['languages', 'frameworks', 'developer_tools', 'libraries'].includes(catKey);

          return (
            <div
              key={catKey}
              className="bg-white border border-[#DEDEDE] p-3.5 space-y-2 rounded-none"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <label className="text-xs font-semibold text-[#222222]">
                    {displayLabel}
                  </label>
                  {!isStandard && (
                    <span className="text-[10px] px-1 py-0.2 border border-[#DEDEDE] bg-[#F7F7F7] text-[#666666] font-mono">
                      Custom
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-[11px] text-[#888888] font-mono">
                    {currentItems.length} skill{currentItems.length === 1 ? '' : 's'}
                  </span>
                  {!isStandard && (
                    <button
                      type="button"
                      onClick={() => removeCategory(catKey)}
                      className="p-1 text-[#888888] hover:text-[#c62828] border border-[#DEDEDE] hover:bg-[#F0F0F0] transition-colors rounded-none"
                      title="Delete category"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>

              <TagInput
                items={currentItems}
                onChange={(newItems) => updateCategoryItems(catKey, newItems)}
                placeholder={defaultDef?.placeholder || `Add skills to ${displayLabel}...`}
                suggestions={defaultDef?.suggestions || []}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
};
