// ATS Resume Screener - TypeScript Type Definitions

export interface ParsedSections {
  contact: string;
  summary: string;
  skills: string;
  experience: string;
  education: string;
  projects: string;
  certifications: string;
}

export interface ParsedResume {
  file_name: string;
  raw_text: string;
  sections: ParsedSections;
  skills_found: string[];
}

export interface JobDescriptionInput {
  title: string;
  company: string;
  description: string;
  required_skills: string[];
  preferred_skills: string[];
  min_experience: number;
  degree_required: string;
}

export interface ScoreBreakdown {
  required_skills_score: number;
  preferred_skills_score: number;
  experience_score: number;
  projects_score: number;
  education_score: number;
  keyword_match_score: number;
  completeness_score: number;
}

export interface AnalysisResult {
  overall_score: number;
  recommendation: string;
  score_breakdown: ScoreBreakdown;
  matched_skills: string[];
  missing_required: string[];
  missing_preferred: string[];
  relevant_experience: string[];
  relevant_projects: string[];
  education_match: string;
  explanation: string;
  suggestions: string[];
  rejection_reasons: string[];
  confidence: number;
  resume_skills_found?: string[];
}

export interface HistoryEntry {
  id: string;
  resume_name: string;
  job_title: string;
  company: string;
  overall_score: number;
  recommendation: string;
  created_at: string;
  result: AnalysisResult | null;
  resume_text?: string;
  job_description?: string;
  job?: JobDescriptionInput;
  resume?: ParsedResume;
}

export type RecommendationLevel = 'Strong Match' | 'Moderate Match' | 'Weak Match' | 'Reject / Not Relevant';

export interface TailoredExperience {
  original: string;
  tailored: string;
  injected_skills: string[];
}

export interface TailorResult {
  professional_summary: string;
  tailored_skills: string[];
  experience_bullets: TailoredExperience[];
}

export interface TailorCoverLetterRequest {
  cover_letter_text: string;
  job: JobDescriptionInput;
}

export interface TailorCoverLetterResult {
  revised_cover_letter: string;
  explanation: string;
}
