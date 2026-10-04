/**
 * API client for CVstart backend communication.
 */

import {
  Resume,
  ResumeVersion,
  StructuredResume,
  SystemDiagnostics,
  OllamaModelInfo,
  ChangePlan,
  RefinementResult
} from '../types/resume';

const BASE_URL = '';

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {})
  };

  const response = await fetch(`${BASE_URL}${endpoint}`, {
    ...options,
    headers
  });

  if (!response.ok) {
    let errorDetail = `HTTP ${response.status}`;
    try {
      const errJson = await response.json();
      errorDetail = errJson.error || errJson.details || JSON.stringify(errJson);
    } catch {
      errorDetail = await response.text();
    }
    throw new Error(errorDetail || `Request failed with status ${response.status}`);
  }

  // Handle empty bodies
  if (response.status === 204) {
    return {} as T;
  }

  return response.json();
}

export const api = {
  // --- Resumes CRUD ---
  async listResumes(): Promise<Resume[]> {
    return request<Resume[]>('/api/resumes/');
  },

  async getResume(id: string): Promise<Resume> {
    return request<Resume>(`/api/resumes/${id}/`);
  },

  async createResume(data: Partial<Resume>): Promise<Resume> {
    return request<Resume>('/api/resumes/', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  },

  async updateResume(id: string, data: Partial<Resume>, createVersion = false, changeSummary = ''): Promise<Resume> {
    return request<Resume>(`/api/resumes/${id}/`, {
      method: 'PATCH',
      body: JSON.stringify({
        ...data,
        create_version: createVersion,
        change_summary: changeSummary
      })
    });
  },

  async deleteResume(id: string): Promise<{ message: string }> {
    return request<{ message: string }>(`/api/resumes/${id}/`, {
      method: 'DELETE'
    });
  },

  async listVersions(id: string): Promise<ResumeVersion[]> {
    return request<ResumeVersion[]>(`/api/resumes/${id}/versions/`);
  },

  async restoreVersion(id: string, versionNumber: number): Promise<Resume> {
    return request<Resume>(`/api/resumes/${id}/versions/${versionNumber}/restore/`, {
      method: 'POST'
    });
  },

  async duplicateResume(id: string): Promise<Resume> {
    return request<Resume>(`/api/resumes/${id}/duplicate/`, {
      method: 'POST'
    });
  },

  // --- LaTeX & Compilation ---
  async generateLatex(id: string, template?: string, options?: any): Promise<{ latex_source: string }> {
    return request<{ latex_source: string }>(`/api/latex/generate/${id}/`, {
      method: 'POST',
      body: JSON.stringify({ template, ...options })
    });
  },

  async compileLatex(id: string, source?: string, saveVersion = false): Promise<{
    success: boolean;
    pdf_url?: string;
    errors: any[];
    log: string;
    duration_seconds: number;
  }> {
    return request(`/api/latex/compile/${id}/`, {
      method: 'POST',
      body: JSON.stringify({ source, save_version: saveVersion })
    });
  },

  async validateLatex(source: string): Promise<{ valid: boolean; errors: string[]; warnings: string[] }> {
    return request('/api/latex/validate/', {
      method: 'POST',
      body: JSON.stringify({ source })
    });
  },

  getPdfUrl(id: string): string {
    return `/api/latex/pdf/${id}/?t=${Date.now()}`;
  },

  async getPdfPages(id: string): Promise<{
    resume_id: string;
    pages_count: number;
    pages: Array<{
      page_number: number;
      image_path: string;
      base64: string;
      width: number;
      height: number;
    }>;
  }> {
    return request(`/api/latex/pdf/${id}/pages/?t=${Date.now()}`);
  },

  getExportUrl(id: string, format: 'pdf' | 'tex' | 'zip' = 'pdf'): string {
    return `/api/latex/export/${id}/?format=${format}`;
  },

  // --- AI & Inspection ---
  async listModels(): Promise<{
    ollama_reachable: boolean;
    ollama_error?: string;
    models_count: number;
    models: OllamaModelInfo[];
    default_model: string;
  }> {
    return request('/api/ai/models/');
  },

  async parseRawResume(rawText: string, model?: string): Promise<{ structured_data: StructuredResume }> {
    return request('/api/ai/parse-raw/', {
      method: 'POST',
      body: JSON.stringify({ raw_text: rawText, model })
    });
  },

  async planChanges(id: string, instruction: string, model?: string): Promise<ChangePlan> {
    return request<ChangePlan>(`/api/ai/plan-changes/${id}/`, {
      method: 'POST',
      body: JSON.stringify({ instruction, model })
    });
  },

  async applyChanges(id: string, proposedData: StructuredResume, summary?: string): Promise<{
    success: boolean;
    compile_success: boolean;
    resume: Resume;
    pdf_url?: string;
    compile_errors: any[];
  }> {
    return request(`/api/ai/apply-changes/${id}/`, {
      method: 'POST',
      body: JSON.stringify({
        proposed_structured_data: proposedData,
        summary
      })
    });
  },

  async iterativeRefine(
    id: string,
    instruction: string,
    model?: string,
    targetPages = 1,
    autoApply = true
  ): Promise<RefinementResult> {
    return request<RefinementResult>(`/api/ai/refine/${id}/`, {
      method: 'POST',
      body: JSON.stringify({
        instruction,
        model,
        target_pages: targetPages,
        auto_apply: autoApply
      })
    });
  },

  async inspectPdf(id: string, targetPages = 1, model?: string): Promise<any> {
    return request(`/api/inspection/inspect/${id}/`, {
      method: 'POST',
      body: JSON.stringify({ target_pages: targetPages, model })
    });
  },

  // --- System Diagnostics ---
  async getDiagnostics(): Promise<SystemDiagnostics> {
    return request<SystemDiagnostics>('/api/system/diagnostics/');
  }
};
