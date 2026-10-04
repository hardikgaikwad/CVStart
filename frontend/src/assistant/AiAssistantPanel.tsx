import React, { useState } from 'react';
import {
  Send,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  ShieldCheck,
  Check,
  X,
  MessageSquare
} from 'lucide-react';
import { ChangePlan, RefinementResult, OllamaModelInfo } from '../types/resume';

interface AiAssistantPanelProps {
  resumeId: string;
  selectedModel: string;
  models: OllamaModelInfo[];
  onSelectModel: (model: string) => void;
  onPlanRequest: (instruction: string) => Promise<ChangePlan>;
  onApplyPlan: (plan: ChangePlan) => Promise<void>;
  onIterativeRefine: (instruction: string, targetPages: number) => Promise<RefinementResult>;
  onClose?: () => void;
}

export const AiAssistantPanel: React.FC<AiAssistantPanelProps> = ({
  resumeId,
  selectedModel,
  models,
  onSelectModel,
  onPlanRequest,
  onApplyPlan,
  onIterativeRefine,
  onClose
}) => {
  const [prompt, setPrompt] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [activePlan, setActivePlan] = useState<ChangePlan | null>(null);
  const [refineResult, setRefineResult] = useState<RefinementResult | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [targetPages, setTargetPages] = useState<number>(1);
  const [agentMode, setAgentMode] = useState<'standard' | 'agentic_loop'>('agentic_loop');
  const [currentModel, setCurrentModel] = useState<string>(selectedModel);

  // Sync and auto-default to installed Ollama model if none selected
  React.useEffect(() => {
    if (selectedModel) {
      setCurrentModel(selectedModel);
    } else if (models && models.length > 0) {
      const defaultM = models[0].name;
      setCurrentModel(defaultM);
      onSelectModel(defaultM);
    }
  }, [selectedModel, models]);

  const handleModelSelect = (val: string) => {
    setCurrentModel(val);
    onSelectModel(val);
  };

  const suggestedPrompts = [
    "Make this fit cleanly on exactly 1 page",
    "Tailor descriptions for a Senior Backend Developer role",
    "Strengthen action verbs and eliminate passive voice",
    "Reduce section vertical spacing to compact layout",
  ];

  const handleSubmit = async (customText?: string) => {
    const textToSubmit = customText || prompt;
    if (!textToSubmit.trim() || isLoading) return;

    setIsLoading(true);
    setErrorMsg(null);
    setActivePlan(null);
    setRefineResult(null);

    try {
      if (agentMode === 'agentic_loop') {
        const result = await onIterativeRefine(textToSubmit, targetPages);
        setRefineResult(result);
        setPrompt('');
      } else {
        const plan = await onPlanRequest(textToSubmit);
        setActivePlan(plan);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'AI request failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleApply = async () => {
    if (!activePlan) return;
    setIsLoading(true);
    try {
      await onApplyPlan(activePlan);
      setActivePlan(null);
      setPrompt('');
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to apply change plan');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-white border-l border-[#DEDEDE] text-[#222222] rounded-none">
      {/* Header */}
      <div className="p-3 border-b border-[#DEDEDE] flex items-center justify-between bg-white shrink-0">
        <div className="flex items-center space-x-2">
          <div className="w-6 h-6 border border-[#222222] bg-[#222222] text-white flex items-center justify-center">
            <MessageSquare className="w-3.5 h-3.5" />
          </div>
          <div>
            <h3 className="text-xs font-semibold text-[#222222]">Assistant</h3>
            <p className="text-[10px] text-[#666666]">Natural Language Editing</p>
          </div>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="text-[#888888] hover:text-[#222222] p-1 border border-transparent hover:border-[#DEDEDE] transition-colors"
            title="Close Assistant"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Model & Mode Configuration */}
      <div className="p-3 bg-[#F7F7F7] border-b border-[#DEDEDE] space-y-2 shrink-0">
        <div className="flex items-center justify-between text-xs">
          <span className="text-[#666666] font-medium text-[11px]">Model:</span>
          <select
            value={currentModel || selectedModel}
            onChange={(e) => handleModelSelect(e.target.value)}
            className="bg-white border border-[#DEDEDE] px-2 py-1 text-xs text-[#222222] max-w-[200px] focus:outline-none focus:border-[#222222] rounded-none cursor-pointer"
          >
            {models.map((m) => (
              <option key={m.name} value={m.name}>
                {m.name} {m.supports_vision ? '(Vision)' : ''}
              </option>
            ))}
            <option value="">Rule-based (Fast local)</option>
          </select>
        </div>

        {/* Workflow Mode Selector */}
        <div className="flex items-center justify-between text-xs pt-0.5">
          <span className="text-[#666666] font-medium text-[11px]">Mode:</span>
          <div className="flex border border-[#DEDEDE] bg-white rounded-none">
            <button
              type="button"
              onClick={() => setAgentMode('agentic_loop')}
              className={`px-2.5 py-1 text-[11px] font-medium transition-colors ${
                agentMode === 'agentic_loop' ? 'bg-[#222222] text-white' : 'text-[#666666] hover:text-[#222222]'
              }`}
            >
              Compile & Inspect
            </button>
            <button
              type="button"
              onClick={() => setAgentMode('standard')}
              className={`px-2.5 py-1 text-[11px] font-medium transition-colors border-l border-[#DEDEDE] ${
                agentMode === 'standard' ? 'bg-[#222222] text-white' : 'text-[#666666] hover:text-[#222222]'
              }`}
            >
              Plan & Review
            </button>
          </div>
        </div>
      </div>

      {/* Scrollable Conversation / Output Area */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3 text-xs">
        {/* Suggested Actions */}
        <div>
          <span className="text-[11px] font-medium text-[#666666] block mb-1.5">
            Suggested Actions:
          </span>
          <div className="flex flex-col gap-1">
            {suggestedPrompts.map((s, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleSubmit(s)}
                disabled={isLoading}
                className="text-left px-2.5 py-1.5 bg-white border border-[#DEDEDE] text-[#444444] hover:text-[#222222] hover:bg-[#F0F0F0] transition-colors flex items-center justify-between group disabled:opacity-40 rounded-none text-xs"
              >
                <span className="truncate">{s}</span>
                <ArrowRight className="w-3 h-3 text-[#888888] group-hover:text-[#222222] shrink-0 ml-1" />
              </button>
            ))}
          </div>
        </div>

        {/* Error Message */}
        {errorMsg && (
          <div className="p-3 bg-[#F7F7F7] border border-[#c62828] text-[#c62828] space-y-1 rounded-none">
            <div className="flex items-center gap-1.5 font-semibold">
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>Request Error</span>
            </div>
            <p className="text-[11px]">{errorMsg}</p>
          </div>
        )}

        {/* Loading Indicator */}
        {isLoading && (
          <div className="p-4 bg-[#F7F7F7] border border-[#DEDEDE] flex flex-col items-center justify-center text-center space-y-2 rounded-none">
            <RefreshCw className="w-5 h-5 text-[#222222] animate-spin" />
            <p className="font-medium text-[#222222] text-xs">
              {agentMode === 'agentic_loop' ? 'Running Compile-Inspect-Correct cycle...' : 'Planning resume edits...'}
            </p>
            <p className="text-[11px] text-[#888888]">Evaluating layout geometry and factual integrity</p>
          </div>
        )}

        {/* Refinement Result Display */}
        {refineResult && (
          <div className="p-3 bg-[#F7F7F7] border border-[#DEDEDE] space-y-2.5 rounded-none">
            <div className="flex items-center gap-1.5 font-semibold text-[#2e7d32]">
              <CheckCircle2 className="w-4 h-4" />
              <span>Refinement Cycle Completed</span>
            </div>
            <p className="text-[#444444] leading-relaxed text-xs">{refineResult.summary}</p>

            {/* Iteration Trace */}
            <div className="space-y-1 pt-1">
              <span className="text-[10px] font-mono uppercase tracking-wider text-[#666666] block">
                Agent Trace ({refineResult.iterations_count} iterations):
              </span>
              {refineResult.iteration_trace.map((step, idx) => (
                <div
                  key={idx}
                  className="p-2 bg-white border border-[#DEDEDE] text-[11px] space-y-0.5 rounded-none"
                >
                  <div className="flex items-center justify-between font-medium">
                    <span className="text-[#222222]">Iteration {step.iteration}: {step.action}</span>
                    <span className={step.compile_success ? 'text-[#2e7d32]' : 'text-[#c62828]'}>
                      {step.compile_success ? '✓ Compiled' : '✗ Failed'}
                    </span>
                  </div>
                  {step.pages_count && (
                    <div className="text-[#888888] flex items-center justify-between text-[10px]">
                      <span>Length: {step.pages_count} page(s)</span>
                      {step.outcome && <span className="text-[#444444]">{step.outcome}</span>}
                    </div>
                  )}
                </div>
              ))}
            </div>

            {refineResult.applied_corrections.length > 0 && (
              <div className="pt-1">
                <span className="text-[10px] font-mono uppercase tracking-wider text-[#666666] block mb-1">
                  Corrections Applied:
                </span>
                <ul className="list-disc list-inside space-y-0.5 text-[#444444] text-[11px]">
                  {refineResult.applied_corrections.map((c, i) => (
                    <li key={i}>{c}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {/* Change Plan Review / Diff View */}
        {activePlan && (
          <div className="p-3 bg-white border border-[#DEDEDE] space-y-3 rounded-none">
            <div className="flex items-center justify-between border-b border-[#DEDEDE] pb-2">
              <span className="font-semibold text-[#222222] flex items-center gap-1.5 text-xs">
                <ShieldCheck className="w-4 h-4 text-[#222222]" />
                Proposed Change Plan
              </span>
              <span className="px-1.5 py-0.5 text-[10px] font-mono border border-[#DEDEDE] bg-[#F7F7F7] text-[#666666]">
                {activePlan.change_type}
              </span>
            </div>

            <p className="text-[#444444] leading-relaxed text-xs">{activePlan.summary}</p>

            {/* Diffs */}
            <div className="space-y-1.5 text-[11px]">
              {activePlan.diff_summary.added.length > 0 && (
                <div className="p-2 bg-[#F7F7F7] border border-[#2e7d32] text-[#2e7d32] rounded-none">
                  <span className="font-semibold block mb-0.5">+ Added:</span>
                  {activePlan.diff_summary.added.map((item, i) => (
                    <div key={i}>• {item}</div>
                  ))}
                </div>
              )}

              {activePlan.diff_summary.modified.length > 0 && (
                <div className="p-2 bg-[#F7F7F7] border border-[#DEDEDE] text-[#222222] rounded-none">
                  <span className="font-semibold block mb-0.5">~ Modified:</span>
                  {activePlan.diff_summary.modified.map((item, i) => (
                    <div key={i}>• {item}</div>
                  ))}
                </div>
              )}

              {activePlan.diff_summary.removed.length > 0 && (
                <div className="p-2 bg-[#F7F7F7] border border-[#c62828] text-[#c62828] rounded-none">
                  <span className="font-semibold block mb-0.5">- Removed:</span>
                  {activePlan.diff_summary.removed.map((item, i) => (
                    <div key={i}>• {item}</div>
                  ))}
                </div>
              )}
            </div>

            {/* Accept / Reject controls */}
            <div className="flex items-center justify-end space-x-2 pt-2 border-t border-[#DEDEDE]">
              <button
                type="button"
                onClick={() => setActivePlan(null)}
                className="px-3 py-1.5 border border-[#DEDEDE] hover:bg-[#F0F0F0] text-[#666666] hover:text-[#222222] rounded-none text-xs transition-colors"
              >
                Reject
              </button>
              <button
                type="button"
                onClick={handleApply}
                disabled={isLoading}
                className="px-3 py-1.5 bg-[#222222] hover:bg-[#333333] text-white font-medium flex items-center gap-1.5 rounded-none text-xs border border-[#222222] transition-colors"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Apply Changes</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Prompt Input Form at Bottom */}
      <div className="p-3 border-t border-[#DEDEDE] bg-white shrink-0">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSubmit();
          }}
          className="flex items-center gap-1.5"
        >
          <input
            type="text"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            disabled={isLoading}
            placeholder="e.g. Fit on 1 page and polish bullet points..."
            className="flex-1 bg-white border border-[#DEDEDE] px-3 py-1.5 text-xs text-[#222222] placeholder-[#888888] focus:outline-none focus:border-[#222222] rounded-none"
          />
          <button
            type="submit"
            disabled={isLoading || !prompt.trim()}
            className="px-3 py-1.5 bg-[#222222] hover:bg-[#333333] text-white border border-[#222222] disabled:opacity-30 rounded-none transition-colors cursor-pointer"
            title="Send Instruction"
          >
            <Send className="w-3.5 h-3.5" />
          </button>
        </form>
      </div>
    </div>
  );
};
