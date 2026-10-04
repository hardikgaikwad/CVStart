import React, { useState } from 'react';
import { Award, Trophy, Plus, Trash2 } from 'lucide-react';
import { StructuredResume, CertificationItem, AchievementItem } from '../types/resume';

interface ExtrasFormProps {
  data: StructuredResume;
  onChange: (updated: StructuredResume) => void;
}

export const ExtrasForm: React.FC<ExtrasFormProps> = ({ data, onChange }) => {
  const [activeTab, setActiveTab] = useState<'certifications' | 'achievements'>('certifications');

  // --- Certifications ---
  const addCert = () => {
    const newCert: CertificationItem = { name: '', issuer: '', date: '', url: '' };
    onChange({
      ...data,
      certifications: [...(data.certifications || []), newCert]
    });
  };

  const updateCert = (idx: number, updated: Partial<CertificationItem>) => {
    const list = [...(data.certifications || [])];
    list[idx] = { ...list[idx], ...updated };
    onChange({ ...data, certifications: list });
  };

  const removeCert = (idx: number) => {
    onChange({
      ...data,
      certifications: (data.certifications || []).filter((_, i) => i !== idx)
    });
  };

  // --- Achievements ---
  const addAchievement = () => {
    const newAch: AchievementItem = { title: '', description: '', date: '' };
    onChange({
      ...data,
      achievements: [...(data.achievements || []), newAch]
    });
  };

  const updateAchievement = (idx: number, updated: Partial<AchievementItem>) => {
    const list = [...(data.achievements || [])];
    list[idx] = { ...list[idx], ...updated };
    onChange({ ...data, achievements: list });
  };

  const removeAchievement = (idx: number) => {
    onChange({
      ...data,
      achievements: (data.achievements || []).filter((_, i) => i !== idx)
    });
  };

  return (
    <div className="space-y-4">
      <div className="border-b border-[#DEDEDE] pb-3">
        <h3 className="text-sm font-semibold text-[#222222] flex items-center gap-2">
          <Award className="w-4 h-4 text-[#222222]" />
          Additional Credentials & Sections
        </h3>
        <p className="text-xs text-[#666666] mt-0.5">
          Enhance your profile with professional certifications, honors, and verified awards.
        </p>
      </div>

      {/* Mini Tabs */}
      <div className="flex border-b border-[#DEDEDE] space-x-2">
        <button
          type="button"
          onClick={() => setActiveTab('certifications')}
          className={`pb-2 text-xs font-medium border-b-2 transition-colors flex items-center gap-1.5 rounded-none ${
            activeTab === 'certifications'
              ? 'border-[#222222] text-[#222222]'
              : 'border-transparent text-[#666666] hover:text-[#222222]'
          }`}
        >
          <Award className="w-3.5 h-3.5" />
          <span>Certifications ({data.certifications?.length || 0})</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('achievements')}
          className={`pb-2 text-xs font-medium border-b-2 transition-colors flex items-center gap-1.5 rounded-none ${
            activeTab === 'achievements'
              ? 'border-[#222222] text-[#222222]'
              : 'border-transparent text-[#666666] hover:text-[#222222]'
          }`}
        >
          <Trophy className="w-3.5 h-3.5" />
          <span>Achievements & Honors ({data.achievements?.length || 0})</span>
        </button>
      </div>

      {/* Certifications Tab */}
      {activeTab === 'certifications' && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <button
              type="button"
              onClick={addCert}
              className="inline-flex items-center gap-1 text-xs text-[#222222] hover:underline font-medium"
            >
              <Plus className="w-3.5 h-3.5" /> Add Certification
            </button>
          </div>

          {(data.certifications || []).length === 0 ? (
            <p className="text-xs text-[#888888] text-center py-6 border border-[#DEDEDE] bg-[#F7F7F7]">No certifications added yet.</p>
          ) : (
            (data.certifications || []).map((cert, idx) => (
              <div key={idx} className="bg-white border border-[#DEDEDE] p-3.5 space-y-2 relative rounded-none">
                <button
                  type="button"
                  onClick={() => removeCert(idx)}
                  className="absolute top-2.5 right-2.5 text-[#888888] hover:text-[#c62828] border border-[#DEDEDE] hover:bg-[#F0F0F0] p-1 rounded-none transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 pr-8">
                  <div>
                    <label className="block text-[11px] text-[#666666] mb-0.5">Certificate Name</label>
                    <input
                      type="text"
                      value={cert.name || ''}
                      onChange={(e) => updateCert(idx, { name: e.target.value })}
                      placeholder="e.g. AWS Certified Solutions Architect"
                      className="w-full bg-white border border-[#DEDEDE] px-2.5 py-1 text-xs text-[#222222] placeholder-[#888888] focus:outline-none focus:border-[#222222] rounded-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-[#666666] mb-0.5">Issuer</label>
                    <input
                      type="text"
                      value={cert.issuer || ''}
                      onChange={(e) => updateCert(idx, { issuer: e.target.value })}
                      placeholder="e.g. Amazon Web Services"
                      className="w-full bg-white border border-[#DEDEDE] px-2.5 py-1 text-xs text-[#222222] placeholder-[#888888] focus:outline-none focus:border-[#222222] rounded-none"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[11px] text-[#666666] mb-0.5">Date</label>
                    <input
                      type="text"
                      value={cert.date || ''}
                      onChange={(e) => updateCert(idx, { date: e.target.value })}
                      placeholder="e.g. 2024"
                      className="w-full bg-white border border-[#DEDEDE] px-2.5 py-1 text-xs text-[#222222] placeholder-[#888888] focus:outline-none focus:border-[#222222] rounded-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-[#666666] mb-0.5">Verification URL (optional)</label>
                    <input
                      type="text"
                      value={cert.url || ''}
                      onChange={(e) => updateCert(idx, { url: e.target.value })}
                      placeholder="https://..."
                      className="w-full bg-white border border-[#DEDEDE] px-2.5 py-1 text-xs text-[#222222] placeholder-[#888888] focus:outline-none focus:border-[#222222] rounded-none"
                    />
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Achievements Tab */}
      {activeTab === 'achievements' && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <button
              type="button"
              onClick={addAchievement}
              className="inline-flex items-center gap-1 text-xs text-[#222222] hover:underline font-medium"
            >
              <Plus className="w-3.5 h-3.5" /> Add Achievement
            </button>
          </div>

          {(data.achievements || []).length === 0 ? (
            <p className="text-xs text-[#888888] text-center py-6 border border-[#DEDEDE] bg-[#F7F7F7]">No achievements added yet.</p>
          ) : (
            (data.achievements || []).map((ach, idx) => (
              <div key={idx} className="bg-white border border-[#DEDEDE] p-3.5 space-y-2 relative rounded-none">
                <button
                  type="button"
                  onClick={() => removeAchievement(idx)}
                  className="absolute top-2.5 right-2.5 text-[#888888] hover:text-[#c62828] border border-[#DEDEDE] hover:bg-[#F0F0F0] p-1 rounded-none transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-2 pr-8">
                  <div className="md:col-span-2">
                    <label className="block text-[11px] text-[#666666] mb-0.5">Title / Award</label>
                    <input
                      type="text"
                      value={ach.title || ''}
                      onChange={(e) => updateAchievement(idx, { title: e.target.value })}
                      placeholder="e.g. 1st Place - Global Hackathon 2024"
                      className="w-full bg-white border border-[#DEDEDE] px-2.5 py-1 text-xs text-[#222222] placeholder-[#888888] focus:outline-none focus:border-[#222222] rounded-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-[#666666] mb-0.5">Date</label>
                    <input
                      type="text"
                      value={ach.date || ''}
                      onChange={(e) => updateAchievement(idx, { date: e.target.value })}
                      placeholder="e.g. Oct 2024"
                      className="w-full bg-white border border-[#DEDEDE] px-2.5 py-1 text-xs text-[#222222] placeholder-[#888888] focus:outline-none focus:border-[#222222] rounded-none"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-[11px] text-[#666666] mb-0.5">Description (optional)</label>
                  <input
                    type="text"
                    value={ach.description || ''}
                    onChange={(e) => updateAchievement(idx, { description: e.target.value })}
                    placeholder="Built real-time streaming engine judged top among participants."
                    className="w-full bg-white border border-[#DEDEDE] px-2.5 py-1 text-xs text-[#222222] placeholder-[#888888] focus:outline-none focus:border-[#222222] rounded-none"
                  />
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};
