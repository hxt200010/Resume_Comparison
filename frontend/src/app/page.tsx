'use client';

import React, { useState, useCallback, useEffect, useRef } from 'react';
import Link from 'next/link';
import { ParsedResume, ParsedSections, JobDescriptionInput, AnalysisResult, HistoryEntry } from '../lib/types';
import { parseResume, analyzeMatch, getHistory, deleteHistoryEntry, getDetailedProfile } from '../lib/api';
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
import { ThemeProvider } from '../lib/ThemeContext';
import { AuthProvider, useAuth } from '../components/AuthContext';
import LoginModal from '../components/LoginModal';
import ResumePanel from '../components/ResumePanel';
import JobPanel from '../components/JobPanel';
import AnalyzeButton from '../components/AnalyzeButton';
import ResultsDashboard from '../components/ResultsDashboard';
import HistoryPanel from '../components/HistoryPanel';
import ThemeSelector from '../components/ThemeSelector';

const EMPTY_JOB: JobDescriptionInput = {
  title: '',
  company: '',
  description: '',
  required_skills: [],
  preferred_skills: [],
  min_experience: 0,
  degree_required: '',
};

function HomeContent() {
  // State
  const [resume, setResume] = useState<ParsedResume | null>(null);
  const [job, setJob] = useState<JobDescriptionInput>(EMPTY_JOB);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [isParsingResume, setIsParsingResume] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [backendOnline, setBackendOnline] = useState<boolean | null>(null);

  // Auth State
  const { user, logout } = useAuth();
  const [isLoginOpen, setIsLoginOpen] = useState(false);

  const comparisonRef = useRef<HTMLDivElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);

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

  // Load history on mount or when user changes
  useEffect(() => {
    const loadHistory = async () => {
      if (!user) {
        setHistory([]);
        return;
      }
      try {
        const data = await getHistory();
        setHistory(data);
      } catch {
        // Silently fail — history is optional
      }
    };
    loadHistory();
  }, [user]);

  const refreshHistory = useCallback(async () => {
    if (!user) return;
    try {
      const data = await getHistory();
      setHistory(data);
    } catch {}
  }, [user]);

  // Clear everything on logout
  useEffect(() => {
    if (!user) {
      setResume(null);
      setJob(EMPTY_JOB);
      setResult(null);
      setHistory([]);
      setError(null);
    }
  }, [user]);

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
      return { ...prev, sections: { ...prev.sections, [section]: value } };
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

  const handleLoadProfile = useCallback(async () => {
    if (!user) {
      setError('You must be logged in to load your saved profile.');
      return;
    }
    setIsParsingResume(true);
    setError(null);
    try {
      const profileData = await getDetailedProfile();
      let experienceText = profileData.experience || '';
      try {
        const parsedExp = JSON.parse(experienceText);
        if (Array.isArray(parsedExp)) {
          experienceText = parsedExp.map(exp => `Company: ${exp.company}\nTitle: ${exp.title}\nLocation: ${exp.location}\nDescription: ${exp.description}`).join('\n\n');
        }
      } catch (e) {
        // Leave it as flat string if not JSON
      }

      const contactLine = [profileData.email, profileData.phone, profileData.linkedin, profileData.portfolio].filter(Boolean).join(' | ');
      
      const generatedText = [
        `${profileData.first_name || ''} ${profileData.last_name || ''}`.trim(),
        contactLine ? contactLine : '',
        profileData.skills ? `SKILLS\n${profileData.skills}` : '',
        experienceText ? `EXPERIENCE\n${experienceText}` : '',
        profileData.coursework ? `EDUCATION & COURSEWORK\n${profileData.coursework}` : '',
        profileData.certifications ? `CERTIFICATIONS\n${profileData.certifications}` : ''
      ].filter(Boolean).join('\n\n');

      setResume({
        file_name: 'saved_profile_data.txt',
        raw_text: generatedText,
        sections: {
          contact: `${profileData.first_name || ''} ${profileData.last_name || ''}`.trim(),
          summary: '',
          skills: profileData.skills || '',
          experience: experienceText,
          education: profileData.coursework || '',
          projects: '',
          certifications: profileData.certifications || '',
        },
        skills_found: profileData.skills ? profileData.skills.split(',').map((s: string) => s.trim().toLowerCase()) : [],
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load profile');
    } finally {
      setIsParsingResume(false);
    }
  }, [user]);

  const handleGeneratePDF = useCallback(async (customInstructions: string = "") => {
    if (!resume?.raw_text) {
      setError("Please load or paste a resume first.");
      return;
    }
    setIsGeneratingPDF(true);
    setError(null);
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/generate-resume-pdf`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ profile_text: resume.raw_text, custom_instructions: customInstructions }),
      });
      
      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.detail || 'Failed to generate PDF');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'AI_Tailored_Resume.pdf';
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'PDF generation failed');
    } finally {
      setIsGeneratingPDF(false);
    }
  }, [resume]);

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
      await refreshHistory();
      setTimeout(() => {
        resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 300);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Analysis failed');
    } finally {
      setIsAnalyzing(false);
    }
  }, [resume, job, refreshHistory]);

  const handleNewMatch = useCallback(() => {
    setResume(null);
    setJob(EMPTY_JOB);
    setResult(null);
    setError(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const canAnalyze = !!(resume?.raw_text && job.description);

  // ── History Handlers ────────────────────────
  const handleHistorySelect = useCallback((entry: HistoryEntry) => {
    if (entry.result) {
      setResult(entry.result);
      
      // Load full objects if they exist in history, otherwise piecemeal fallback
      setResume({
        file_name: entry.resume?.file_name || entry.resume_name || 'History Resume',
        raw_text: entry.resume?.raw_text || entry.resume_text || '',
        sections: entry.resume?.sections || { contact: '', summary: '', skills: '', experience: '', education: '', projects: '', certifications: '' },
        skills_found: entry.resume?.skills_found || entry.result?.resume_skills_found || []
      });
      
      setJob({
        title: entry.job?.title || entry.job_title || '',
        company: entry.job?.company || entry.company || '',
        description: entry.job?.description || entry.job_description || '', 
        required_skills: entry.job?.required_skills || [], 
        preferred_skills: entry.job?.preferred_skills || [], 
        min_experience: entry.job?.min_experience || 0, 
        degree_required: entry.job?.degree_required || ''
      });

      // Scroll to results
      setTimeout(() => {
        resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
    }
  }, []);

  const handleHistoryDelete = useCallback(async (id: string) => {
    await deleteHistoryEntry(id);
    setHistory((prev) => prev.filter((e) => e.id !== id));
  }, []);

  const scrollToComparison = () => {
    comparisonRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <div className="min-h-screen">
      {/* ─── Header / Navigation ────────────────── */}
      <header className="border-b sticky top-0 z-50 backdrop-blur-md" style={{ borderColor: 'var(--nav-border)', background: 'var(--nav-bg)' }}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14">
            {/* Logo */}
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'var(--accent)' }}>
                <svg className="w-4.5 h-4.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <span className="text-base font-bold tracking-tight" style={{ color: 'var(--text-heading)' }}>
                ATS Screener
              </span>
            </div>

            {/* Nav Links */}
            <nav className="hidden sm:flex items-center gap-5">
              <button
                onClick={handleNewMatch}
                className="text-sm font-medium transition-colors hover:underline"
                style={{ color: 'var(--accent)' }}
              >
                + New Match
              </button>
              <button
                onClick={scrollToComparison}
                className="text-sm font-medium transition-colors"
                style={{ color: 'var(--text-secondary)' }}
              >
                Compare
              </button>
              <a
                href="#history-section"
                className="text-sm font-medium transition-colors"
                style={{ color: 'var(--text-secondary)' }}
              >
                History
              </a>
            </nav>

            {/* Right: Theme + Status */}
            <div className="flex items-center gap-3">
              <ThemeSelector />
              {backendOnline !== null && (
                <div className={`flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium`}
                  style={{
                    background: backendOnline ? 'var(--success-bg)' : 'var(--danger-bg)',
                    color: backendOnline ? 'var(--success)' : 'var(--danger)',
                    border: `1px solid ${backendOnline ? 'var(--success-border)' : 'var(--danger-border)'}`,
                  }}
                >
                  <span className="w-1.5 h-1.5 rounded-full" style={{ background: backendOnline ? 'var(--success)' : 'var(--danger)' }} />
                  {backendOnline ? 'Connected' : 'Offline'}
                </div>
              )}

              {/* Auth Button */}
              {user ? (
                <>
                  <Link href="/profile" className="text-sm font-medium hover:underline ml-4" style={{ color: 'var(--accent)' }}>
                    My Profile
                  </Link>
                  <div className="flex items-center gap-2 border-l pl-3 ml-3" style={{ borderColor: 'var(--border-color)' }}>
                    <div className="text-xs max-w-[100px] truncate" style={{ color: 'var(--text-primary)' }}>
                      {user.email}
                    </div>
                    <button onClick={logout} className="text-xs hover:underline text-red-500">
                      Logout
                    </button>
                  </div>
                </>
              ) : (
                <button
                  onClick={() => setIsLoginOpen(true)}
                  className="btn-primary ml-2 py-1 px-3 text-xs"
                >
                  Log In
                </button>
              )}
              
            </div>
          </div>
        </div>
      </header>

      {/* Modals */}
      <LoginModal isOpen={isLoginOpen} onClose={() => setIsLoginOpen(false)} />

      {/* ─── Hero Section ───────────────────────── */}
      {!result && (
        <section className="hero-section animate-fade-in-up">
          <h1 className="hero-title">
            Compare your resume to any<br />
            <span className="gradient-text">job description in seconds</span>
          </h1>
          <p className="hero-subtitle">
            Upload your resume, paste the job posting, and get a clear match score
            with missing skills analysis and improvement suggestions.
          </p>
          <button onClick={scrollToComparison} className="btn-hero" id="hero-cta">
            <svg className="w-4.5 h-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            Start Comparison
          </button>
        </section>
      )}

      {/* ─── Main Content ───────────────────────── */}
      {!user ? (
        <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pb-32 pt-20 flex flex-col items-center justify-center min-h-[50vh] animate-fade-in text-center">
          <div className="w-20 h-20 mb-6 border-2 rounded-full flex items-center justify-center shadow-sm" style={{ background: 'var(--bg-card)', borderColor: 'var(--border-color)', color: 'var(--accent)' }}>
             <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
             </svg>
          </div>
          <h2 className="text-3xl font-bold mb-4" style={{ color: 'var(--text-heading)' }}>Access Restricted</h2>
          <p className="text-lg max-w-lg mb-8 leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
            Please log in to your account to upload resumes, analyze job matches, access the Magic Tailor, and view your personalized evaluation history.
          </p>
          <button onClick={() => setIsLoginOpen(true)} className="btn-primary text-base px-8 py-3 shadow-md">
             Log In to Continue
          </button>
        </main>
      ) : (
        <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
          {/* Error Banner */}
          {error && (
            <div className="mb-5 p-3.5 rounded-lg flex items-start gap-3 animate-fade-in"
              style={{ background: 'var(--danger-bg)', border: '1px solid var(--danger-border)' }}>
              <svg className="w-5 h-5 flex-shrink-0 mt-0.5" style={{ color: 'var(--danger)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="flex-1 text-sm" style={{ color: 'var(--danger)' }}>{error}</p>
              <button onClick={() => setError(null)} style={{ color: 'var(--danger)' }}>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          )}

          {/* Backend Offline Warning */}
          {backendOnline === false && (
            <div className="mb-5 p-3.5 rounded-lg animate-fade-in"
              style={{ background: 'var(--warning-bg)', border: '1px solid var(--warning-border)' }}>
              <p className="text-sm font-medium" style={{ color: 'var(--warning)' }}>⚠ Backend API is offline</p>
              <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
                Start the backend: <code style={{ background: 'var(--bg-secondary)', padding: '0.125rem 0.375rem', borderRadius: '0.25rem' }}>
                  cd backend && .venv\Scripts\python -m uvicorn app.main:app --reload
                </code>
              </p>
            </div>
          )}

          {/* ─── Comparison Workspace ─────────────── */}
          <div ref={comparisonRef} id="comparison-section" className="pt-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-2">
              <div className="md:col-span-1 border-r" style={{ borderColor: 'var(--border-color)' }}>
                <div className="p-5 h-full">
                  <ResumePanel
                    resume={resume}
                    isLoading={isParsingResume}
                    onFileSelect={handleFileSelect}
                    onResumeTextChange={handleResumeTextChange}
                    onSectionChange={handleSectionChange}
                    onLoadSample={handleLoadSampleResume}
                    onLoadProfile={handleLoadProfile}
                    onGeneratePDF={handleGeneratePDF}
                    isGeneratingPDF={isGeneratingPDF}
                    isLoggedIn={!!user}
                  />
                </div>
              </div>
              <JobPanel
                job={job}
                onJobChange={handleJobChange}
                onLoadSample={handleLoadSampleJob}
              />
            </div>

            <AnalyzeButton
              onClick={handleAnalyze}
              isLoading={isAnalyzing}
              disabled={!canAnalyze}
            />
          </div>

          {/* Loading */}
          {isAnalyzing && (
            <div className="flex flex-col items-center justify-center py-14">
              <div className="w-12 h-12 border-[3px] rounded-full animate-spin mb-4"
                style={{ borderColor: 'var(--border-color)', borderTopColor: 'var(--accent)' }} />
              <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>Analyzing resume match...</p>
              <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>Running ATS scoring pipeline</p>
            </div>
          )}

          {/* ─── Results ─────────────────────────── */}
          <div ref={resultsRef}>
            {result && resume && !isAnalyzing && (
              <ResultsDashboard result={result} resume={resume} job={job} />
            )}
          </div>

          {/* ─── History ─────────────────────────── */}
          <HistoryPanel
            history={history}
            onSelect={handleHistorySelect}
            onDelete={handleHistoryDelete}
          />
        </main>
      )}

      {/* ─── Footer ─────────────────────────────── */}
      <footer className="py-6" style={{ borderTop: '1px solid var(--border-color)' }}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-center text-xs" style={{ color: 'var(--text-muted)' }}>
            ATS Resume Screener — A simulation tool for educational purposes.
          </p>
        </div>
      </footer>
    </div>
  );
}

export default function Home() {
  return <HomeContent />;
}
