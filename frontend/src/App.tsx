import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { OnboardingModal } from './components/OnboardingModal';
import { Dashboard } from './pages/Dashboard';
import { EditorView } from './pages/EditorView';
import { TemplatesPage } from './pages/TemplatesPage';
import { ModelsPage } from './pages/ModelsPage';
import { DiagnosticsPage } from './pages/DiagnosticsPage';
import { api } from './services/api';
import { Plus, X } from 'lucide-react';

export function App() {
  const [currentView, setCurrentView] = useState<'dashboard' | 'editor' | 'templates' | 'models' | 'diagnostics'>('dashboard');
  const [selectedResumeId, setSelectedResumeId] = useState<string | null>(null);
  const [showHelp, setShowHelp] = useState<boolean>(false);
  const [newModalOpen, setNewModalOpen] = useState<boolean>(false);

  // New Resume Dialog State
  const [newTitle, setNewTitle] = useState<string>('');
  const [newRole, setNewRole] = useState<string>('');
  const [newTemplate, setNewTemplate] = useState<string>('modern_technical');
  const [isCreating, setIsCreating] = useState<boolean>(false);

  // Check if first visit
  useEffect(() => {
    const visited = localStorage.getItem('cvstart_visited');
    if (!visited) {
      setShowHelp(true);
      localStorage.setItem('cvstart_visited', 'true');
    }
  }, []);

  const handleOpenResume = (id: string) => {
    setSelectedResumeId(id);
    setCurrentView('editor');
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || isCreating) return;

    setIsCreating(true);
    try {
      const created = await api.createResume({
        title: newTitle.trim(),
        target_role: newRole.trim(),
        selected_template: newTemplate,
      });

      // Generate initial LaTeX code for the resume
      await api.generateLatex(created.id, newTemplate);

      setNewModalOpen(false);
      setNewTitle('');
      setNewRole('');
      setSelectedResumeId(created.id);
      setCurrentView('editor');
    } catch (err: any) {
      alert(`Failed to create resume: ${err.message}`);
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FFFFFF] text-[#222222] flex flex-col font-sans selection:bg-[#EAEAEA]">
      <Navbar
        currentView={currentView}
        onNavigate={(view) => {
          if (view === 'new') {
            setNewModalOpen(true);
          } else {
            setCurrentView(view as any);
          }
        }}
        onOpenHelp={() => setShowHelp(true)}
      />

      <main className="flex-1 flex flex-col overflow-auto bg-[#FFFFFF]">
        {currentView === 'dashboard' && (
          <Dashboard
            onOpenResume={handleOpenResume}
            onCreateNew={() => setNewModalOpen(true)}
          />
        )}

        {currentView === 'editor' && selectedResumeId && (
          <EditorView
            resumeId={selectedResumeId}
            onBack={() => setCurrentView('dashboard')}
          />
        )}

        {currentView === 'templates' && (
          <TemplatesPage
            onNavigate={(view) => setCurrentView(view as any)}
          />
        )}

        {currentView === 'models' && <ModelsPage />}

        {currentView === 'diagnostics' && <DiagnosticsPage />}
      </main>

      {/* Onboarding Guide Modal */}
      <OnboardingModal
        isOpen={showHelp}
        onClose={() => setShowHelp(false)}
      />

      {/* New Resume Creation Modal */}
      {newModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/30 flex items-center justify-center p-4">
          <div className="bg-white border border-[#DEDEDE] max-w-md w-full p-6 shadow-sm space-y-4 rounded-none">
            <div className="flex items-center justify-between border-b border-[#DEDEDE] pb-3">
              <h3 className="text-sm font-medium text-[#222222] flex items-center gap-2">
                <Plus className="w-4 h-4 text-[#222222]" />
                Create New Resume
              </h3>
              <button
                onClick={() => setNewModalOpen(false)}
                className="text-[#888888] hover:text-[#222222] p-1 transition-colors"
                title="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-[#666666] mb-1">
                  Resume Title *
                </label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g. Senior Software Engineer - Google"
                  className="w-full bg-white border border-[#DEDEDE] px-3 py-2 text-sm text-[#222222] placeholder-[#888888] focus:outline-none focus:border-[#222222] rounded-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-[#666666] mb-1">
                  Target Role (optional)
                </label>
                <input
                  type="text"
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value)}
                  placeholder="e.g. Senior Backend Architect"
                  className="w-full bg-white border border-[#DEDEDE] px-3 py-2 text-sm text-[#222222] placeholder-[#888888] focus:outline-none focus:border-[#222222] rounded-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-[#666666] mb-1">
                  Initial LaTeX Template
                </label>
                <select
                  value={newTemplate}
                  onChange={(e) => setNewTemplate(e.target.value)}
                  className="w-full bg-white border border-[#DEDEDE] px-3 py-2 text-sm text-[#222222] focus:outline-none focus:border-[#222222] rounded-none"
                >
                  <option value="modern_technical">Modern Technical (Single-Column ATS Standard)</option>
                  <option value="minimalist">Minimalist 1-Page (High Density Monochrome)</option>
                  <option value="executive">Executive Serif (Leadership & Distinguish)</option>
                </select>
              </div>

              <div className="flex items-center justify-end space-x-2 pt-3 border-t border-[#DEDEDE]">
                <button
                  type="button"
                  onClick={() => setNewModalOpen(false)}
                  className="px-3.5 py-1.5 text-xs text-[#666666] hover:bg-[#F0F0F0] border border-[#DEDEDE] rounded-none transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!newTitle.trim() || isCreating}
                  className="px-3.5 py-1.5 bg-[#222222] hover:bg-[#333333] text-white text-xs font-medium border border-[#222222] rounded-none transition-colors disabled:opacity-40"
                >
                  {isCreating ? 'Creating...' : 'Create & Open Editor'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
