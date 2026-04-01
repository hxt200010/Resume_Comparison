// ATS Resume Screener - API Client
// Handles all communication with the FastAPI backend

import { ParsedResume, JobDescriptionInput, AnalysisResult, HistoryEntry } from './types';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

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
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ resume, job }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: 'Analysis failed' }));
    throw new Error(error.detail || 'Analysis failed');
  }

  return response.json();
}

/**
 * Get analysis history from Supabase
 */
export async function getHistory(limit = 20): Promise<HistoryEntry[]> {
  const response = await fetch(`${API_URL}/history?limit=${limit}`);
  if (!response.ok) return [];
  const data = await response.json();
  return data.history || [];
}

/**
 * Delete an analysis from history
 */
export async function deleteHistoryEntry(id: string): Promise<boolean> {
  const response = await fetch(`${API_URL}/history/${id}`, { method: 'DELETE' });
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
