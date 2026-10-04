import React, { useState, useEffect } from 'react';
import {
  Plus,
  FileText,
  Copy,
  Trash2,
  Download,
  Calendar,
  Layers,
  ArrowRight,
  Upload,
  AlertCircle
} from 'lucide-react';
import { api } from '../services/api';
import { Resume } from '../types/resume';

interface DashboardProps {
  onOpenResume: (id: string) => void;
  onCreateNew: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ onOpenResume, onCreateNew }) => {
  const [resumes, setResumes] = useState<Resume[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [importModalOpen, setImportModalOpen] = useState<boolean>(false);
  const [rawText, setRawText] = useState<string>('');
  const [importing, setImporting] = useState<boolean>(false);

  const fetchResumes = async () => {
    try {
      setLoading(true);
      const data = await api.listResumes();
      setResumes(data);
      setError(null);
    } catch (e: any) {
      setError(e.message || 'Failed to load resumes');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchResumes();
  }, []);

  const [deleteTarget, setDeleteTarget] = useState<{ id: string; title: string } | null>(null);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  const handleDuplicate = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const cloned = await api.duplicateResume(id);
      fetchResumes();
      onOpenResume(cloned.id);
    } catch (err: any) {
      alert(`Error cloning resume: ${err.message}`);
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      await api.deleteResume(deleteTarget.id);
      setDeleteTarget(null);
      await fetchResumes();
    } catch (err: any) {
      alert(`Error deleting resume: ${err.message}`);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleDownload = async (resumeId: string, title: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setDownloadingId(resumeId);
    try {
      const res = await fetch(api.getExportUrl(resumeId, 'pdf'));
      if (!res.ok) {
        throw new Error('PDF could not be downloaded.');
      }
      const blob = await res.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = blobUrl;
      const cleanTitle = title.replace(/[^a-zA-Z0-9_-]/g, '_') || 'resume';
      a.download = `${cleanTitle}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(blobUrl);
    } catch (err: any) {
      alert(`Download failed: ${err.message}`);
    } finally {
      setDownloadingId(null);
    }
  };

  const handleImport = async () => {
    if (!rawText.trim() || importing) return;
    setImporting(true);
    try {
      const res = await api.parseRawResume(rawText);
      const newResume = await api.createResume({
        title: `${res.structured_data.personal?.full_name || 'Imported'} Resume`,
        target_role: res.structured_data.personal?.title || 'Software Engineer',
        structured_data: res.structured_data,
        selected_template: 'modern_technical'
      });
      // Generate initial LaTeX
      await api.generateLatex(newResume.id, 'modern_technical');
      setImportModalOpen(false);
      setRawText('');
      onOpenResume(newResume.id);
    } catch (err: any) {
      alert(`Failed to import text: ${err.message}`);
    } finally {
      setImporting(false);
    }
  };

  const createSampleResume = async (role: 'swe' | 'data') => {
    let title = "Alex Morgan - Full Stack Engineer";
    let target_role = "Senior Full Stack Engineer";
    let summary = "Versatile Full Stack Engineer with 6+ years of experience building modern web architectures, resilient distributed APIs, and performant user interfaces.";
    let skills = {
      languages: ["Python", "TypeScript", "JavaScript", "SQL", "Go"],
      frameworks: ["Django", "React", "Next.js", "FastAPI"],
      developer_tools: ["Docker", "Kubernetes", "AWS", "Git", "Linux"],
      libraries: ["PostgreSQL", "Redis", "Tailwind CSS"]
    };

    if (role === 'data') {
      title = "Jordan Lee - Machine Learning Engineer";
      target_role = "Senior ML & Data Systems Engineer";
      summary = "Specialized Machine Learning Engineer experienced in scalable model training, RAG pipelines, and high-throughput real-time inference microservices.";
      skills = {
        languages: ["Python", "C++", "SQL", "R"],
        frameworks: ["PyTorch", "TensorFlow", "HuggingFace", "FastAPI"],
        developer_tools: ["Docker", "Weights & Biases", "Kubernetes", "MLflow", "AWS"],
        libraries: ["Pandas", "NumPy", "Scikit-Learn", "Faiss"]
      };
    }

    try {
      const sample = await api.createResume({
        title,
        target_role,
        structured_data: {
          personal: {
            full_name: role === 'data' ? "Jordan Lee" : "Alex Morgan",
            title: target_role,
            email: "contact@example.com",
            phone: "+1 (555) 345-6789",
            location: "San Francisco, CA",
            website: "https://portfolio.example.com",
            github: "https://github.com/developer",
            linkedin: "https://linkedin.com/in/developer"
          },
          summary,
          experience: [
            {
              company: "Starlight Cloud Platforms",
              role: target_role,
              location: "San Francisco, CA",
              start_date: "2022",
              end_date: "Present",
              current: true,
              description: "",
              highlights: [
                "Architected event-driven microservices handling 15,000 requests/sec with p99 latency under 45ms.",
                "Engineered automated CI/CD pipeline reducing release cycle times by 65% across 14 services."
              ]
            }
          ],
          education: [
            {
              institution: "University of California, Berkeley",
              degree: "B.S.",
              field_of_study: "Computer Science",
              start_date: "2016",
              end_date: "2020",
              gpa: "3.88",
              coursework: ["Algorithms", "Distributed Systems", "Database Design"],
              highlights: []
            }
          ],
          projects: [
            {
              name: "Real-time Telemetry Engine",
              description: "Distributed telemetry broker capable of ingesting high-cardinality metrics.",
              technologies: ["Go", "Kafka", "Docker", "TimescaleDB"],
              url: "https://github.com/developer/telemetry-broker",
              start_date: "2023",
              end_date: "2023",
              highlights: [
                "Achieved sub-10ms query execution across 500GB daily telemetry streams."
              ]
            }
          ],
          skills,
          certifications: [],
          achievements: [],
          publications: [],
          custom_sections: []
        },
        selected_template: 'modern_technical'
      });

      await api.generateLatex(sample.id, 'modern_technical');
      await api.compileLatex(sample.id);
      onOpenResume(sample.id);
    } catch (err: any) {
      alert(`Failed to create sample: ${err.message}`);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-6 py-8 space-y-6 w-full">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#DEDEDE] pb-5">
        <div>
          <h1 className="text-xl font-semibold text-[#222222] tracking-tight">My Resumes</h1>
          <p className="text-xs text-[#666666] mt-0.5">
            Local documents managed in SQLite and compiled with native LaTeX.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setImportModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-white text-[#222222] border border-[#DEDEDE] hover:bg-[#F0F0F0] transition-colors cursor-pointer"
          >
            <Upload className="w-3.5 h-3.5 text-[#666666]" />
            <span>Import Notes</span>
          </button>
          <button
            onClick={onCreateNew}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-[#222222] text-white hover:bg-[#333333] border border-[#222222] transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Create Resume</span>
          </button>
        </div>
      </div>

      {/* Resumes Listing (Table-Based / Flat Structured List) */}
      {loading ? (
        <div className="py-16 text-center text-xs text-[#888888]">Loading documents...</div>
      ) : error ? (
        <div className="p-3 bg-[#F7F7F7] border border-[#c62828] text-[#c62828] text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      ) : resumes.length === 0 ? (
        /* Empty State */
        <div className="text-center py-16 px-4 border border-[#DEDEDE] bg-[#F7F7F7] space-y-4">
          <div className="max-w-md mx-auto space-y-1">
            <h3 className="text-sm font-medium text-[#222222]">No resumes created yet</h3>
            <p className="text-xs text-[#666666]">
              Create a new resume from scratch or generate a starter engineering profile.
            </p>
          </div>

          <div className="pt-2 flex flex-wrap items-center justify-center gap-2">
            <button
              onClick={onCreateNew}
              className="px-3.5 py-1.5 bg-[#222222] hover:bg-[#333333] text-white text-xs font-medium border border-[#222222] transition-colors"
            >
              + Create Blank Resume
            </button>
            <button
              onClick={() => createSampleResume('swe')}
              className="px-3.5 py-1.5 bg-white hover:bg-[#F0F0F0] text-[#222222] text-xs font-medium border border-[#DEDEDE] transition-colors"
            >
              + Sample: Full Stack Engineer
            </button>
            <button
              onClick={() => createSampleResume('data')}
              className="px-3.5 py-1.5 bg-white hover:bg-[#F0F0F0] text-[#222222] text-xs font-medium border border-[#DEDEDE] transition-colors"
            >
              + Sample: ML & Systems Engineer
            </button>
          </div>
        </div>
      ) : (
        /* Flat Table Listing */
        <div className="border border-[#DEDEDE] bg-white overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-[#DEDEDE] bg-[#F7F7F7] text-[#666666] font-medium">
                <th className="py-2.5 px-4 font-medium">Resume Title</th>
                <th className="py-2.5 px-4 font-medium">Target Role</th>
                <th className="py-2.5 px-4 font-medium">Template</th>
                <th className="py-2.5 px-4 font-medium">Version</th>
                <th className="py-2.5 px-4 font-medium">Last Modified</th>
                <th className="py-2.5 px-4 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#DEDEDE]">
              {resumes.map((resume) => (
                <tr
                  key={resume.id}
                  onClick={() => onOpenResume(resume.id)}
                  className="hover:bg-[#F7F7F7] cursor-pointer transition-colors group"
                >
                  <td className="py-3 px-4 font-medium text-[#222222]">
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4 text-[#666666] shrink-0" />
                      <span className="group-hover:underline">{resume.title}</span>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-[#666666]">
                    {resume.target_role || '—'}
                  </td>
                  <td className="py-3 px-4 font-mono text-[11px] text-[#666666]">
                    {resume.selected_template.replace('_', ' ')}
                  </td>
                  <td className="py-3 px-4 font-mono text-[11px] text-[#888888]">
                    v{resume.version}
                  </td>
                  <td className="py-3 px-4 text-[#888888] text-[11px]">
                    {new Date(resume.updated_at).toLocaleDateString()}
                  </td>
                  <td className="py-3 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center justify-end space-x-1">
                      <button
                        onClick={() => onOpenResume(resume.id)}
                        className="px-2 py-1 text-[11px] bg-white border border-[#DEDEDE] text-[#222222] hover:bg-[#F0F0F0] transition-colors"
                        title="Open Editor"
                      >
                        Open
                      </button>
                      <button
                        onClick={(e) => handleDuplicate(resume.id, e)}
                        className="p-1 text-[#666666] hover:text-[#222222] border border-[#DEDEDE] hover:bg-[#F0F0F0] transition-colors"
                        title="Duplicate"
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={(e) => handleDownload(resume.id, resume.title, e)}
                        disabled={downloadingId === resume.id}
                        className="p-1 text-[#666666] hover:text-[#222222] border border-[#DEDEDE] hover:bg-[#F0F0F0] transition-colors inline-block disabled:opacity-50"
                        title="Download PDF"
                      >
                        <Download className={`w-3.5 h-3.5 ${downloadingId === resume.id ? 'animate-bounce' : ''}`} />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setDeleteTarget({ id: resume.id, title: resume.title });
                        }}
                        className="p-1 text-[#888888] hover:text-[#c62828] border border-[#DEDEDE] hover:bg-[#F0F0F0] transition-colors"
                        title="Delete"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Raw Notes Import Modal */}
      {importModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/30 flex items-center justify-center p-4">
          <div className="bg-white border border-[#DEDEDE] max-w-xl w-full p-6 space-y-4 shadow-sm">
            <div className="flex items-center justify-between border-b border-[#DEDEDE] pb-3">
              <div className="flex items-center gap-2 text-sm font-semibold text-[#222222]">
                <Upload className="w-4 h-4 text-[#222222]" />
                <span>Import Resume from Notes</span>
              </div>
              <button
                onClick={() => setImportModalOpen(false)}
                className="text-[#888888] hover:text-[#222222]"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-[#666666] leading-relaxed">
              Paste your raw work history, notes, or profile export below.
              The parser will extract your experience, education, and skills into structured resume fields.
            </p>

            <textarea
              rows={10}
              value={rawText}
              onChange={(e) => setRawText(e.target.value)}
              placeholder="e.g. Alex Morgan - Seattle, WA - alex@example.com&#10;&#10;Experience:&#10;Apex Systems - Senior Backend Engineer (2021-Present)&#10;• Designed high throughput Go microservices...&#10;&#10;Education:&#10;UW Computer Science B.S."
              className="w-full bg-white border border-[#DEDEDE] p-3 text-xs text-[#222222] placeholder-[#888888] focus:outline-none focus:border-[#222222] font-mono rounded-none"
            />

            <div className="flex items-center justify-end space-x-2 pt-2 border-t border-[#DEDEDE]">
              <button
                onClick={() => setImportModalOpen(false)}
                className="px-3.5 py-1.5 text-xs text-[#666666] hover:bg-[#F0F0F0] border border-[#DEDEDE] transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleImport}
                disabled={!rawText.trim() || importing}
                className="px-3.5 py-1.5 bg-[#222222] hover:bg-[#333333] text-white text-xs font-medium border border-[#222222] transition-colors disabled:opacity-40 flex items-center gap-1.5 cursor-pointer"
              >
                {importing ? (
                  <>
                    <div className="w-3 h-3 border-2 border-white border-t-transparent animate-spin" />
                    <span>Parsing...</span>
                  </>
                ) : (
                  <span>Parse into Resume</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Delete Confirmation Modal */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white border border-[#DEDEDE] max-w-sm w-full p-5 space-y-4 shadow-sm rounded-none">
            <div className="flex items-center justify-between border-b border-[#DEDEDE] pb-2.5">
              <h3 className="text-xs font-semibold text-[#222222] uppercase tracking-wider">
                Confirm Deletion
              </h3>
              <button
                onClick={() => setDeleteTarget(null)}
                className="text-[#888888] hover:text-[#222222] text-xs"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-[#666666] leading-relaxed">
              Are you sure you want to permanently delete <strong className="text-[#222222]">{deleteTarget.title}</strong>? All associated versions and compiled files will be removed.
            </p>

            <div className="flex items-center justify-end space-x-2 pt-2 border-t border-[#DEDEDE]">
              <button
                onClick={() => setDeleteTarget(null)}
                disabled={isDeleting}
                className="px-3 py-1.5 text-xs text-[#666666] hover:bg-[#F0F0F0] border border-[#DEDEDE] transition-colors rounded-none cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                disabled={isDeleting}
                className="px-3.5 py-1.5 bg-[#c62828] hover:bg-[#b71c1c] text-white text-xs font-medium border border-[#c62828] transition-colors disabled:opacity-50 rounded-none cursor-pointer flex items-center gap-1.5"
              >
                {isDeleting ? 'Deleting...' : 'Delete Resume'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
