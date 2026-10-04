import React, { useState, useEffect } from 'react';
import {
  ArrowLeft,
  Save,
  FileCode,
  Eye,
  History,
  Layers,
  CheckCircle2,
  SlidersHorizontal,
  MessageSquare
} from 'lucide-react';
import { api } from '../services/api';
import { Resume, ResumeVersion, StructuredResume, OllamaModelInfo, ChangePlan } from '../types/resume';

import { PersonalInfoForm } from '../editor/PersonalInfoForm';
import { SummaryForm } from '../editor/SummaryForm';
import { ExperienceForm } from '../editor/ExperienceForm';
import { ProjectsForm } from '../editor/ProjectsForm';
import { EducationForm } from '../editor/EducationForm';
import { SkillsForm } from '../editor/SkillsForm';
import { ExtrasForm } from '../editor/ExtrasForm';

import { PdfViewer } from '../preview/PdfViewer';
import { LatexEditor } from '../preview/LatexEditor';
import { AiAssistantPanel } from '../assistant/AiAssistantPanel';

interface EditorViewProps {
  resumeId: string;
  onBack: () => void;
}

export const EditorView: React.FC<EditorViewProps> = ({ resumeId, onBack }) => {
  const [resume, setResume] = useState<Resume | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [isCompiling, setIsCompiling] = useState<boolean>(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState<boolean>(false);
  const [isOutdated, setIsOutdated] = useState<boolean>(false);

  const [activeTab, setActiveTab] = useState<'personal' | 'summary' | 'experience' | 'projects' | 'education' | 'skills' | 'extras'>('personal');
  const [rightView, setRightView] = useState<'pdf' | 'latex'>('pdf');
  const [isAiOpen, setIsAiOpen] = useState<boolean>(false);
  const [historyOpen, setHistoryOpen] = useState<boolean>(false);

  const [versions, setVersions] = useState<ResumeVersion[]>([]);
  const [models, setModels] = useState<OllamaModelInfo[]>([]);
  const [compileErrors, setCompileErrors] = useState<any[]>([]);
  const [inspectionReport, setInspectionReport] = useState<any>(null);
  const [selectedAiModel, setSelectedAiModel] = useState<string>('');

  // Load resume data
  const loadResumeData = async () => {
    try {
      setLoading(true);
      const data = await api.getResume(resumeId);
      setResume(data);
      if (data.selected_model) {
        setSelectedAiModel(data.selected_model);
      }

      if (!data.current_latex) {
        const gen = await api.generateLatex(data.id, data.selected_template);
        data.current_latex = gen.latex_source;
        setResume({ ...data, current_latex: gen.latex_source });
      }

      api.listModels().then(res => {
        setModels(res.models);
        if (!data.selected_model && res.models && res.models.length > 0) {
          const defaultM = res.default_model || res.models[0].name;
          setSelectedAiModel(defaultM);
          setResume(prev => prev ? { ...prev, selected_model: defaultM } : null);
        }
      }).catch(() => {});
    } catch (e: any) {
      alert(`Error loading resume: ${e.message}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadResumeData();
  }, [resumeId]);

  const handleStructuredChange = (updated: StructuredResume) => {
    if (!resume) return;
    setResume({
      ...resume,
      structured_data: updated
    });
    setHasUnsavedChanges(true);
    setIsOutdated(true);
  };

  const handleSave = async (createVersion = false, summary = 'Saved changes') => {
    if (!resume) return;
    setIsSaving(true);
    try {
      const updated = await api.updateResume(
        resume.id,
        {
          title: resume.title,
          target_role: resume.target_role,
          structured_data: resume.structured_data,
          current_latex: resume.current_latex,
          selected_template: resume.selected_template,
          preferred_page_size: resume.preferred_page_size,
          selected_model: resume.selected_model
        },
        createVersion,
        summary
      );
      setResume(updated);
      setHasUnsavedChanges(false);
    } catch (err: any) {
      alert(`Save failed: ${err.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCompile = async () => {
    if (!resume) return;
    setIsCompiling(true);
    setCompileErrors([]);
    try {
      if (rightView === 'pdf') {
        const gen = await api.generateLatex(resume.id, resume.selected_template, {
          paper_size: resume.preferred_page_size,
        });
        resume.current_latex = gen.latex_source;
      }

      const res = await api.compileLatex(resume.id, resume.current_latex, false);
      if (res.success) {
        setIsOutdated(false);
        setHasUnsavedChanges(false);
        const refreshed = await api.getResume(resume.id);
        setResume(refreshed);
      } else {
        setCompileErrors(res.errors);
      }
    } catch (err: any) {
      setCompileErrors([{ message: err.message }]);
    } finally {
      setIsCompiling(false);
    }
  };

  const handleInspect = async () => {
    if (!resume) return;
    try {
      const modelToUse = selectedAiModel || resume.selected_model;
      const rep = await api.inspectPdf(resume.id, 1, modelToUse);
      setInspectionReport(rep);
    } catch (err: any) {
      console.error(err);
    }
  };

  const handleModelChange = async (newModel: string) => {
    setSelectedAiModel(newModel);
    if (resume) {
      setResume(prev => prev ? { ...prev, selected_model: newModel } : null);
      try {
        await api.updateResume(resume.id, { selected_model: newModel });
      } catch (e) {
        console.error('Failed to persist model choice:', e);
      }
    }
  };

  const handlePlanRequest = async (instruction: string): Promise<ChangePlan> => {
    if (!resume) throw new Error("Resume not loaded");
    const modelToUse = selectedAiModel || resume.selected_model;
    return api.planChanges(resume.id, instruction, modelToUse);
  };

  const handleApplyPlan = async (plan: ChangePlan) => {
    if (!resume) return;
    const res = await api.applyChanges(resume.id, plan.proposed_structured_data, plan.summary);
    if (res.success) {
      setResume(res.resume);
      setIsOutdated(false);
      setHasUnsavedChanges(false);
    }
  };

  const handleIterativeRefine = async (instruction: string, targetPages: number) => {
    if (!resume) throw new Error("Resume not loaded");
    const modelToUse = selectedAiModel || resume.selected_model;
    const result = await api.iterativeRefine(
      resume.id,
      instruction,
      modelToUse,
      targetPages,
      true
    );
    if (result.success) {
      const refreshed = await api.getResume(resume.id);
      setResume(refreshed);
      setIsOutdated(false);
      setHasUnsavedChanges(false);
    }
    return result;
  };

  const openHistory = async () => {
    if (!resume) return;
    try {
      const vList = await api.listVersions(resume.id);
      setVersions(vList);
      setHistoryOpen(true);
    } catch (err: any) {
      alert(`Could not load versions: ${err.message}`);
    }
  };

  const handleRestoreVersion = async (versionNumber: number) => {
    if (!resume) return;
    if (!window.confirm(`Restore resume to Revision v${versionNumber}? Current changes will be archived in history.`)) return;
    try {
      const restored = await api.restoreVersion(resume.id, versionNumber);
      setResume(restored);
      setHistoryOpen(false);
      setHasUnsavedChanges(false);
      setIsOutdated(false);
    } catch (err: any) {
      alert(`Restore failed: ${err.message}`);
    }
  };

  if (loading || !resume) {
    return (
      <div className="flex items-center justify-center min-h-[80vh] text-[#888888] text-xs">
        Loading document...
      </div>
    );
  }

  const pdfUrl = resume.latest_pdf_path ? api.getPdfUrl(resume.id) : undefined;

  return (
    <div className="flex flex-col h-[calc(100vh-45px)] bg-white overflow-hidden text-[#222222]">
      {/* Editor Sub-Header Toolbar */}
      <div className="px-4 py-2 bg-white border-b border-[#DEDEDE] flex items-center justify-between gap-4 shrink-0">
        {/* Left: Back & Title Edit */}
        <div className="flex items-center space-x-2.5 min-w-0">
          <button
            onClick={onBack}
            className="p-1 text-[#666666] hover:text-[#222222] border border-[#DEDEDE] hover:bg-[#F0F0F0] rounded-none transition-colors"
            title="Back to Resumes"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
          </button>

          <div className="flex flex-col">
            <input
              type="text"
              value={resume.title}
              onChange={(e) => {
                setResume({ ...resume, title: e.target.value });
                setHasUnsavedChanges(true);
              }}
              className="bg-transparent font-semibold text-xs text-[#222222] hover:bg-[#F7F7F7] px-1 py-0.5 border border-transparent hover:border-[#DEDEDE] focus:bg-white focus:border-[#222222] focus:outline-none rounded-none"
            />
            <div className="flex items-center gap-2 px-1 text-[11px] text-[#666666]">
              <span className="truncate max-w-[180px]">{resume.target_role || 'No role set'}</span>
              <span>•</span>
              <span className="font-mono text-[#888888]">v{resume.version}</span>
              {hasUnsavedChanges ? (
                <span className="text-[#b26a00] font-mono flex items-center gap-1 font-medium">
                  <span className="w-1.5 h-1.5 bg-[#b26a00]" /> Unsaved edits
                </span>
              ) : (
                <span className="text-[#2e7d32] font-mono flex items-center gap-1">
                  <span className="w-1.5 h-1.5 bg-[#2e7d32]" /> Saved
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Center: Template & View Mode */}
        <div className="flex items-center space-x-2">
          {/* Template Selector */}
          <div className="hidden lg:flex items-center bg-white border border-[#DEDEDE] px-2 py-1 text-xs rounded-none">
            <Layers className="w-3.5 h-3.5 text-[#666666] mr-1.5" />
            <select
              value={resume.selected_template}
              onChange={async (e) => {
                const tpl = e.target.value;
                setResume({ ...resume, selected_template: tpl });
                await api.generateLatex(resume.id, tpl);
                setIsOutdated(true);
                handleSave(false, `Changed template to ${tpl}`);
              }}
              className="bg-transparent text-[#222222] text-xs focus:outline-none cursor-pointer rounded-none"
            >
              <option value="modern_technical">Modern Technical</option>
              <option value="minimalist">Minimalist 1-Page</option>
              <option value="executive">Executive Serif</option>
            </select>
          </div>

          {/* Right Pane View Toggle */}
          <div className="flex border border-[#DEDEDE] bg-white rounded-none text-xs">
            <button
              onClick={() => setRightView('pdf')}
              className={`px-3 py-1 font-medium transition-colors flex items-center gap-1.5 rounded-none ${
                rightView === 'pdf' ? 'bg-[#222222] text-white' : 'text-[#666666] hover:text-[#222222]'
              }`}
            >
              <Eye className="w-3.5 h-3.5" />
              <span>PDF Preview</span>
            </button>
            <button
              onClick={() => setRightView('latex')}
              className={`px-3 py-1 font-medium transition-colors flex items-center gap-1.5 border-l border-[#DEDEDE] rounded-none ${
                rightView === 'latex' ? 'bg-[#222222] text-white' : 'text-[#666666] hover:text-[#222222]'
              }`}
            >
              <FileCode className="w-3.5 h-3.5" />
              <span>LaTeX Source</span>
            </button>
          </div>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center space-x-1.5">
          {/* Save Button */}
          <button
            onClick={() => handleSave(true, 'Manual save')}
            disabled={isSaving}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-white hover:bg-[#F0F0F0] text-[#222222] border border-[#DEDEDE] transition-colors disabled:opacity-40 rounded-none cursor-pointer"
            title="Save to local database (creates version snapshot)"
          >
            <Save className="w-3.5 h-3.5 text-[#222222]" />
            <span>{isSaving ? 'Saving...' : 'Save'}</span>
          </button>

          {/* Version History Button */}
          <button
            onClick={openHistory}
            className="p-1.5 text-[#666666] hover:text-[#222222] bg-white hover:bg-[#F0F0F0] border border-[#DEDEDE] rounded-none transition-colors"
            title="Revision History"
          >
            <History className="w-3.5 h-3.5" />
          </button>

          {/* AI Assistant Toggle Button */}
          <button
            onClick={() => setIsAiOpen(!isAiOpen)}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium border rounded-none transition-colors cursor-pointer ${
              isAiOpen
                ? 'bg-[#222222] text-white border-[#222222]'
                : 'bg-white text-[#222222] border-[#DEDEDE] hover:bg-[#F0F0F0]'
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>Assistant</span>
          </button>
        </div>
      </div>

      {/* Main Workspace Area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Column: Structured Form Editor */}
        <div className="w-full lg:w-1/2 flex flex-col border-r border-[#DEDEDE] bg-white">
          {/* Section Navigation Tabs */}
          <div className="flex overflow-x-auto px-4 pt-1.5 border-b border-[#DEDEDE] gap-0.5 bg-[#F7F7F7] shrink-0">
            {[
              { key: 'personal', label: 'Personal' },
              { key: 'summary', label: 'Summary' },
              { key: 'experience', label: `Experience (${resume.structured_data.experience?.length || 0})` },
              { key: 'projects', label: `Projects (${resume.structured_data.projects?.length || 0})` },
              { key: 'education', label: `Education (${resume.structured_data.education?.length || 0})` },
              { key: 'skills', label: 'Skills' },
              { key: 'extras', label: 'Extras' },
            ].map(tab => (
              <button
                key={tab.key}
                type="button"
                onClick={() => setActiveTab(tab.key as any)}
                className={`px-3 py-1.5 text-xs font-medium border-t border-x whitespace-nowrap transition-colors cursor-pointer rounded-none ${
                  activeTab === tab.key
                    ? 'border-t-[#222222] border-x-[#DEDEDE] bg-white text-[#222222] -mb-px'
                    : 'border-transparent text-[#666666] hover:text-[#222222] hover:bg-[#EAEAEA]'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Tab Body */}
          <div className="flex-1 overflow-y-auto p-4 lg:p-6 space-y-4 bg-white">
            {activeTab === 'personal' && (
              <PersonalInfoForm
                data={resume.structured_data.personal}
                onChange={(p) => handleStructuredChange({ ...resume.structured_data, personal: p })}
              />
            )}

            {activeTab === 'summary' && (
              <SummaryForm
                summary={resume.structured_data.summary}
                onChange={(s) => handleStructuredChange({ ...resume.structured_data, summary: s })}
                onAskAi={() => setIsAiOpen(true)}
              />
            )}

            {activeTab === 'experience' && (
              <ExperienceForm
                items={resume.structured_data.experience || []}
                onChange={(exps) => handleStructuredChange({ ...resume.structured_data, experience: exps })}
                onAskAi={() => setIsAiOpen(true)}
              />
            )}

            {activeTab === 'projects' && (
              <ProjectsForm
                items={resume.structured_data.projects || []}
                onChange={(projs) => handleStructuredChange({ ...resume.structured_data, projects: projs })}
              />
            )}

            {activeTab === 'education' && (
              <EducationForm
                items={resume.structured_data.education || []}
                onChange={(edus) => handleStructuredChange({ ...resume.structured_data, education: edus })}
              />
            )}

            {activeTab === 'skills' && (
              <SkillsForm
                skills={resume.structured_data.skills || { languages: [], frameworks: [], developer_tools: [], libraries: [] }}
                onChange={(s) => handleStructuredChange({ ...resume.structured_data, skills: s })}
              />
            )}

            {activeTab === 'extras' && (
              <ExtrasForm
                data={resume.structured_data}
                onChange={(ext) => handleStructuredChange(ext)}
              />
            )}
          </div>
        </div>

        {/* Right Column: PDF Preview OR LaTeX Editor */}
        <div className="hidden lg:flex flex-1 flex-col p-2 bg-[#F2F2F2] overflow-hidden">
          {rightView === 'pdf' ? (
            <PdfViewer
              resumeId={resume.id}
              pdfUrl={pdfUrl}
              isOutdated={isOutdated}
              isCompiling={isCompiling}
              compileErrors={compileErrors}
              onCompile={handleCompile}
              onInspect={handleInspect}
              inspectionReport={inspectionReport}
            />
          ) : (
            <LatexEditor
              latexSource={resume.current_latex}
              onChange={(newSource) => {
                setResume({ ...resume, current_latex: newSource });
                setHasUnsavedChanges(true);
                setIsOutdated(true);
              }}
              onRestore={async () => {
                const gen = await api.generateLatex(resume.id, resume.selected_template);
                setResume({ ...resume, current_latex: gen.latex_source });
              }}
              resumeId={resume.id}
            />
          )}
        </div>

        {/* AI Assistant Side Drawer */}
        {isAiOpen && (
          <div className="w-80 md:w-96 shrink-0 h-full border-l border-[#DEDEDE] z-30 transition-all bg-white">
            <AiAssistantPanel
              resumeId={resume.id}
              selectedModel={selectedAiModel || resume.selected_model}
              models={models}
              onSelectModel={handleModelChange}
              onPlanRequest={handlePlanRequest}
              onApplyPlan={handleApplyPlan}
              onIterativeRefine={handleIterativeRefine}
              onClose={() => setIsAiOpen(false)}
            />
          </div>
        )}
      </div>

      {/* Revision History Modal */}
      {historyOpen && (
        <div className="fixed inset-0 z-50 bg-black/30 flex items-center justify-center p-4">
          <div className="bg-white border border-[#DEDEDE] max-w-lg w-full p-6 shadow-sm space-y-4 rounded-none">
            <div className="flex items-center justify-between border-b border-[#DEDEDE] pb-3">
              <h3 className="text-sm font-semibold text-[#222222] flex items-center gap-2">
                <History className="w-4 h-4 text-[#222222]" />
                Version History (Revisions)
              </h3>
              <button
                onClick={() => setHistoryOpen(false)}
                className="text-[#888888] hover:text-[#222222]"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-[#666666]">
              Every save and AI change creates an immutable revision snapshot. You can roll back to any previous state.
            </p>

            <div className="max-h-80 overflow-y-auto space-y-2 pr-1">
              {versions.length === 0 ? (
                <p className="text-xs text-[#888888] text-center py-6">No snapshots saved yet.</p>
              ) : (
                versions.map((ver) => (
                  <div
                    key={ver.id}
                    className="p-3 bg-[#F7F7F7] border border-[#DEDEDE] flex items-center justify-between text-xs rounded-none"
                  >
                    <div>
                      <div className="flex items-center gap-2 font-medium text-[#222222]">
                        <span className="font-mono text-[11px] bg-white border border-[#DEDEDE] px-1.5 py-0.5">
                          v{ver.version_number}
                        </span>
                        <span>{ver.change_summary}</span>
                      </div>
                      <span className="text-[10px] text-[#888888] block mt-1">
                        {new Date(ver.created_at).toLocaleString()}
                      </span>
                    </div>

                    <button
                      onClick={() => handleRestoreVersion(ver.version_number)}
                      className="px-2.5 py-1 text-[11px] font-medium bg-white text-[#222222] hover:bg-[#EAEAEA] border border-[#DEDEDE] transition-colors rounded-none"
                    >
                      Rollback
                    </button>
                  </div>
                ))
              )}
            </div>

            <div className="flex justify-end pt-2 border-t border-[#DEDEDE]">
              <button
                onClick={() => setHistoryOpen(false)}
                className="px-3.5 py-1.5 text-xs text-[#666666] hover:bg-[#F0F0F0] border border-[#DEDEDE] transition-colors rounded-none"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
