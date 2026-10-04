/**
 * TypeScript definitions for CVstart data models and API responses.
 */

export interface PersonalInfo {
  full_name: string;
  title: string;
  email: string;
  phone: string;
  location: string;
  website: string;
  github: string;
  linkedin: string;
}

export interface EducationItem {
  institution: string;
  degree: string;
  field_of_study: string;
  start_date: string;
  end_date: string;
  gpa: string;
  coursework: string[];
  highlights: string[];
}

export interface ExperienceItem {
  company: string;
  role: string;
  location: string;
  start_date: string;
  end_date: string;
  current: boolean;
  description: string;
  highlights: string[];
}

export interface ProjectItem {
  name: string;
  description: string;
  technologies: string[];
  url: string;
  start_date: string;
  end_date: string;
  highlights: string[];
}

export interface TechnicalSkills {
  languages: string[];
  frameworks: string[];
  developer_tools: string[];
  libraries: string[];
  [key: string]: string[];
}

export interface CertificationItem {
  name: string;
  issuer: string;
  date: string;
  url: string;
}

export interface AchievementItem {
  title: string;
  description: string;
  date: string;
}

export interface PublicationItem {
  title: string;
  publisher: string;
  date: string;
  url: string;
}

export interface CustomSectionItem {
  title?: string;
  description?: string;
  [key: string]: any;
}

export interface CustomSection {
  heading: string;
  items: CustomSectionItem[];
}

export interface StructuredResume {
  personal: PersonalInfo;
  summary: string;
  education: EducationItem[];
  experience: ExperienceItem[];
  projects: ProjectItem[];
  skills: TechnicalSkills;
  certifications: CertificationItem[];
  achievements: AchievementItem[];
  publications: PublicationItem[];
  custom_sections: CustomSection[];
}

export interface Resume {
  id: string;
  title: string;
  target_role: string;
  structured_data: StructuredResume;
  selected_template: string;
  preferred_page_size: string;
  selected_model: string;
  current_latex: string;
  latest_pdf_path: string;
  version: number;
  versions_count: number;
  created_at: string;
  updated_at: string;
}

export interface ResumeVersion {
  id: string;
  version_number: number;
  change_summary: string;
  structured_data: StructuredResume;
  latex_source: string;
  pdf_path: string;
  created_at: string;
}

export interface OllamaModelInfo {
  name: string;
  model: string;
  size_bytes: number;
  parameter_size: string;
  family: string;
  families: string[];
  supports_vision: boolean;
  supports_structured_json: boolean;
}

export interface SystemDiagnostics {
  platform: {
    os: string;
    os_release: string;
    os_version: string;
    python_version: string;
    executable: string;
  };
  latex: {
    available: boolean;
    compiler_type: string | null;
    executable_path: string | null;
    version_info: string | null;
    error: string | null;
    install_guidance?: string;
  };
  ollama: {
    available: boolean;
    url: string;
    models_count: number;
    models: string[];
    details?: any[];
    error: string | null;
    install_guidance?: string;
  };
  workspace: {
    workspace_path: string;
    is_writable: boolean;
    database_exists: boolean;
    database_size_bytes: number;
  };
  app_version: string;
}

export interface ChangePlan {
  change_type: 'content' | 'structure' | 'styling' | 'layout' | 'explanation';
  target_sections: string[];
  summary: string;
  diff_summary: {
    added: string[];
    modified: string[];
    removed: string[];
  };
  requires_approval: boolean;
  proposed_structured_data: StructuredResume;
  warnings: string[];
  model_used: string;
  fallback_note?: string;
}

export interface IterationStep {
  iteration: number;
  action: string;
  compile_success: boolean;
  pages_count?: number;
  issues_detected?: number;
  outcome?: string;
}

export interface RefinementResult {
  success: boolean;
  status: string;
  summary: string;
  pages_count: number;
  target_pages: number;
  iterations_count: number;
  applied_corrections: string[];
  iteration_trace: IterationStep[];
  plan: ChangePlan;
  pdf_url?: string;
  resume?: any;
}
