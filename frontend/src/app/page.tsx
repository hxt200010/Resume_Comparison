'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { ParsedResume, ParsedSections, JobDescriptionInput, AnalysisResult, HistoryEntry } from '../lib/types';
import { parseResume, analyzeMatch, getHistory, deleteHistoryEntry } from '../lib/api';
import {
  SAMPLE_RESUME_TEXT,
  SAMPLE_JOB_DESCRIPTION,
  SAMPLE_JOB_TITLE,
  SAMPLE_COMPANY,
  SAMPLE_REQUIRED_SKILLS,
  SAMPLE_PREFERRED_SKILLS,
  SAMPLE_MIN_EXPERIENCE,
  SAMPLE_DEGREE,
} from '../lib/sampleData';
import ResumePanel from '../components/ResumePanel';
import JobPanel from '../components/JobPanel';
import ResultsDashboard from '../components/ResultsDashboard';
import HistoryPanel from '../components/HistoryPanel';

const EMPTY_JOB: JobDescriptionInput = {
  title: '',
  company: '',
  description: '',
  required_skills: [],
  preferred_skills: [],
  min_experience: 0,
  degree_required: '',
};

export default function Home() {
  // State
  const [resume, setResume] = useState<ParsedResume | null>(null);
  const [job, setJob] = useState<JobDescriptionInput>(EMPTY_JOB);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [isParsingResume, setIsParsingResume] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [backendOnline, setBackendOnline] = useState<boolean | null>(null);

  // Check backend health on mount
  useEffect(() => {
    const checkBackend = async () => {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/health`);
        setBackendOnline(res.ok);
      } catch {
        setBackendOnline(false);
      }
    };
    checkBackend();
  }, []);

  // Load history on mount
  useEffect(() => {
    const loadHistory = async () => {
      try {
        const data = await getHistory();
        setHistory(data);
      } catch {
        // Silently fail — history is optional
      }
    };
    loadHistory();
  }, []);

  // Reload history after analysis
  const refreshHistory = useCallback(async () => {
    try {
      const data = await getHistory();
      setHistory(data);
    } catch {
      // Silently fail
    }
  }, []);

  // ── Resume Handlers ─────────────────────────
  const handleFileSelect = useCallback(async (file: File) => {
    setIsParsingResume(true);
    setError(null);
    try {
      const parsed = await parseResume(file);
      setResume(parsed);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to parse resume');
    } finally {
      setIsParsingResume(false);
    }
  }, []);

  const handleResumeTextChange = useCallback((text: string) => {
    setResume((prev) => ({
      file_name: prev?.file_name || 'pasted_text',
      raw_text: text,
      sections: prev?.sections || {
        contact: '', summary: '', skills: '', experience: '',
        education: '', projects: '', certifications: '',
      },
      skills_found: prev?.skills_found || [],
    }));
  }, []);

  const handleSectionChange = useCallback((section: keyof ParsedSections, value: string) => {
    setResume((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        sections: { ...prev.sections, [section]: value },
      };
    });
  }, []);

  const handleLoadSampleResume = useCallback(() => {
    setResume({
      file_name: 'sample_resume.txt',
      raw_text: SAMPLE_RESUME_TEXT,
      sections: {
        contact: 'john.smith@email.com | (555) 123-4567',
        summary: 'Full-stack software engineer with 4+ years of experience building scalable web applications.',
        skills: 'JavaScript, TypeScript, Python, SQL, HTML, CSS, React, Next.js, Tailwind CSS, Node.js, Express, FastAPI, Django, REST APIs, GraphQL, PostgreSQL, MongoDB, Redis, AWS, Docker, Git, Agile',
        experience: SAMPLE_RESUME_TEXT.split('EXPERIENCE')[1]?.split('EDUCATION')[0]?.trim() || '',
        education: 'Bachelor of Science in Computer Science | State University | May 2019\nGPA: 3.7/4.0',
        projects: SAMPLE_RESUME_TEXT.split('PROJECTS')[1]?.split('CERTIFICATIONS')[0]?.trim() || '',
        certifications: 'AWS Certified Cloud Practitioner (2023)\nMeta Front-End Developer Certificate (2022)',
      },
      skills_found: [
        'javascript', 'typescript', 'python', 'sql', 'html', 'css', 'react',
        'next.js', 'tailwind css', 'node.js', 'express', 'fastapi', 'django',
        'rest api', 'graphql', 'postgresql', 'mongodb', 'redis', 'amazon web services',
        'docker', 'git', 'agile', 'unit testing', 'responsive design',
      ],
    });
    setError(null);
  }, []);

  // ── Job Handlers ────────────────────────────
  const handleJobChange = useCallback((updates: Partial<JobDescriptionInput>) => {
    setJob((prev) => ({ ...prev, ...updates }));
  }, []);

  const handleLoadSampleJob = useCallback(() => {
    setJob({
      title: SAMPLE_JOB_TITLE,
      company: SAMPLE_COMPANY,
      description: SAMPLE_JOB_DESCRIPTION,
      required_skills: SAMPLE_REQUIRED_SKILLS.split(', '),
      preferred_skills: SAMPLE_PREFERRED_SKILLS.split(', '),
      min_experience: SAMPLE_MIN_EXPERIENCE,
      degree_required: SAMPLE_DEGREE,
    });
  }, []);

  // ── Analysis ────────────────────────────────
  const handleAnalyze = useCallback(async () => {
    if (!resume || !job.description) return;
    setIsAnalyzing(true);
    setError(null);
    setResult(null);
    try {
      const analysisResult = await analyzeMatch(resume, job);
      setResult(analysisResult);
      // Refresh history after analysis
      await refreshHistory();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Analysis failed');
    } finally {
      setIsAnalyzing(false);
    }
  }, [resume, job, refreshHistory]);

  const canAnalyze = !!(resume?.raw_text && job.description);

  // ── History Handlers ────────────────────────
  const handleHistorySelect = useCallback((entry: HistoryEntry) => {
    if (entry.result) {
      setResult(entry.result);
    }
  }, []);

  const handleHistoryDelete = useCallback(async (id: string) => {
    await deleteHistoryEntry(id);
    setHistory((prev) => prev.filter((e) => e.id !== id));
  }, []);

  return (
    <div className="relative z-10 min-h-screen">
      {/* Header */}
      <header className="border-b border-white/[0.05] backdrop-blur-xl bg-[var(--bg-primary)]/80 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-lg shadow-indigo-500/25">
                <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <div>
                <h1 className="text-base font-bold text-white tracking-tight">
                  ATS Resume Screener
                </h1>
                <p className="text-[10px] text-slate-500 -mt-0.5">AI-Powered Resume Analysis</p>
              </div>
            </div>

            {/* Backend Status */}
            <div className="flex items-center gap-2">
              {backendOnline !== null && (
                <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] ${
                  backendOnline
                    ? 'bg-green-500/10 text-green-400 border border-green-500/20'
                    : 'bg-red-500/10 text-red-400 border border-red-500/20'
                }`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${backendOnline ? 'bg-green-400' : 'bg-red-400'}`} />
                  {backendOnline ? 'API Connected' : 'API Offline'}
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Error Banner */}
        {error && (
          <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 flex items-start gap-3 animate-fade-in">
            <svg className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div className="flex-1">
              <p className="text-sm text-red-300">{error}</p>
            </div>
            <button onClick={() => setError(null)} className="text-red-400 hover:text-red-300">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        )}

        {/* Backend Offline Warning */}
        {backendOnline === false && (
          <div className="mb-6 p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 animate-fade-in">
            <p className="text-sm text-amber-300 font-medium">⚠️ Backend API is offline</p>
            <p className="text-xs text-amber-400/70 mt-1">
              Please start the backend server. Run: <code className="bg-amber-500/10 px-1.5 py-0.5 rounded">cd backend &amp;&amp; .venv\Scripts\python -m uvicorn app.main:app --reload</code>
            </p>
          </div>
        )}

        {/* Two-Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <ResumePanel
            resume={resume}
            isLoading={isParsingResume}
            onFileSelect={handleFileSelect}
            onResumeTextChange={handleResumeTextChange}
            onSectionChange={handleSectionChange}
            onLoadSample={handleLoadSampleResume}
          />
          <JobPanel
            job={job}
            onJobChange={handleJobChange}
            onAnalyze={handleAnalyze}
            onLoadSample={handleLoadSampleJob}
            isLoading={isAnalyzing}
            canAnalyze={canAnalyze}
          />
        </div>

        {/* Loading State */}
        {isAnalyzing && (
          <div className="glass-card flex flex-col items-center justify-center py-12 mb-8 animate-pulse-glow">
            <div className="w-16 h-16 border-3 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin mb-4" />
            <p className="text-sm text-slate-300 font-medium">Analyzing resume match...</p>
            <p className="text-xs text-slate-500 mt-1">Running ATS scoring pipeline</p>
          </div>
        )}

        {/* Results */}
        {result && !isAnalyzing && <ResultsDashboard result={result} />}

        {/* History */}
        <div className="mt-8">
          <HistoryPanel
            history={history}
            onSelect={handleHistorySelect}
            onDelete={handleHistoryDelete}
            isOpen={historyOpen}
            onToggle={() => setHistoryOpen(!historyOpen)}
          />
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-white/[0.03] mt-12 py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-center text-[10px] text-slate-600">
            ATS Resume Screener — A simulation tool for educational purposes. Not a real enterprise ATS.
          </p>
        </div>
      </footer>
    </div>
  );
}
