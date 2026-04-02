// ATS Resume Screener - API Client
// Handles all communication with the FastAPI backend

import { ParsedResume, JobDescriptionInput, AnalysisResult, HistoryEntry, TailorResult, TailorCoverLetterResult } from './types';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

/**
 * Helper to get Auth Header
 */
const getAuthHeaders = (): Record<string, string> => {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('token');
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
  }
  return headers;
};

/**
 * Parse a resume file (PDF, DOCX, or TXT)
 */
export async function parseResume(file: File): Promise<ParsedResume> {
  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch(`${API_URL}/parse-resume`, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: 'Failed to parse resume' }));
    throw new Error(error.detail || 'Failed to parse resume');
  }

  return response.json();
}

/**
 * Analyze a resume against a job description
 */
export async function analyzeMatch(
  resume: ParsedResume,
  job: JobDescriptionInput,
): Promise<AnalysisResult> {
  const response = await fetch(`${API_URL}/analyze-match`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({ resume, job }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: 'Analysis failed' }));
    throw new Error(error.detail || 'Analysis failed');
  }

  return response.json();
}

/**
 * Request AI to rewrite resume sections to include missing skills
 */
export async function tailorResume(
  resume: ParsedResume,
  job: JobDescriptionInput,
  missing_skills: string[],
): Promise<TailorResult> {
  const response = await fetch(`${API_URL}/tailor`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ resume, job, missing_skills }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: 'Failed to tailor resume' }));
    throw new Error(error.detail || 'Failed to tailor resume');
  }

  return response.json();
}

/**
 * Request AI to rewrite a cover letter to include missing skills and match a job description
 */
export async function tailorCoverLetter(
  cover_letter_text: string,
  job: JobDescriptionInput,
  resume?: ParsedResume
): Promise<TailorCoverLetterResult> {
  const response = await fetch(`${API_URL}/tailor-cover-letter`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ cover_letter_text, job, resume }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: 'Failed to tailor cover letter' }));
    throw new Error(error.detail || 'Failed to tailor cover letter');
  }

  return response.json();
}

/**
 * Get analysis history from Supabase
 */
export async function getHistory(limit = 20): Promise<HistoryEntry[]> {
  const response = await fetch(`${API_URL}/history?limit=${limit}`, {
    headers: getAuthHeaders()
  });
  if (!response.ok) return [];
  const data = await response.json();
  return data.history || [];
}

/**
 * Delete an analysis from history
 */
export async function deleteHistoryEntry(id: string): Promise<boolean> {
  const response = await fetch(`${API_URL}/history/${id}`, { 
    method: 'DELETE',
    headers: getAuthHeaders()
  });
  if (!response.ok) return false;
  const data = await response.json();
  return data.success;
}

/**
 * Health check
 */
export async function checkHealth(): Promise<boolean> {
  try {
    const response = await fetch(`${API_URL}/health`);
    return response.ok;
  } catch {
    return false;
  }
}

/**
 * Auth API Bindings
 */
export async function registerUser(email: string, password: string) {
  const res = await fetch(`${API_URL}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function loginUser(email: string, password: string) {
  const res = await fetch(`${API_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });
  if (!res.ok) throw new Error('Invalid credentials');
  return res.json();
}

export async function loginWithGoogle(token: string) {
  const res = await fetch(`${API_URL}/auth/google`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token })
  });
  if (!res.ok) throw new Error('Google Login Failed');
  return res.json();
}

export async function getUserProfile() {
  const res = await fetch(`${API_URL}/auth/me`, {
    headers: getAuthHeaders()
  });
  if (!res.ok) throw new Error('Not authenticated');
  return res.json();
}

export async function saveDocument(doc_type: string, name: string, content: string) {
  const res = await fetch(`${API_URL}/auth/save-document`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({ doc_type, name, content })
  });
  if (!res.ok) throw new Error('Failed to save document');
  return res.json();
}

export async function deleteDocument(doc_id: number) {
  const res = await fetch(`${API_URL}/auth/document/${doc_id}`, {
    method: 'DELETE',
    headers: getAuthHeaders()
  });
  if (!res.ok) throw new Error('Failed to delete document');
  return res.json();
}

export async function getDetailedProfile() {
  const res = await fetch(`${API_URL}/profile`, {
    headers: getAuthHeaders()
  });
  if (!res.ok) throw new Error('Failed to fetch profile');
  return res.json();
}

export async function updateDetailedProfile(data: any) {
  const res = await fetch(`${API_URL}/profile`, {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify(data)
  });
  if (!res.ok) throw new Error('Failed to update profile');
  return res.json();
}

/**
 * Request AI to extract job details from a raw posting string
 */
export async function extractJob(raw_text: string): Promise<JobDescriptionInput> {
  const response = await fetch(`${API_URL}/extract-job`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ raw_text }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: 'Failed to extract job details' }));
    throw new Error(error.detail || 'Failed to extract job details');
  }

  return response.json();
}

export async function extractProfile(raw_text: string) {
  const response = await fetch(`${API_URL}/extract-profile`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ raw_text }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: 'Failed to extract profile details' }));
    throw new Error(error.detail || 'Failed to extract profile details');
  }

  return response.json();
}

export async function reviseDocument(document_text: string, doc_type: string) {
  const response = await fetch(`${API_URL}/revise-document`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ document_text, doc_type }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: 'Failed to revise document' }));
    throw new Error(error.detail || 'Failed to revise document');
  }

  return response.json();
}
