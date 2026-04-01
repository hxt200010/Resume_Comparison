'use client';

import React, { useState } from 'react';
import { ParsedResume, ParsedSections } from '../lib/types';
import FileUpload from './FileUpload';

interface ResumePanelProps {
  resume: ParsedResume | null;
  isLoading: boolean;
  onFileSelect: (file: File) => void;
  onResumeTextChange: (text: string) => void;
  onSectionChange: (section: keyof ParsedSections, value: string) => void;
  onLoadSample: () => void;
  onLoadProfile?: () => void;
  isLoggedIn?: boolean;
}

export default function ResumePanel({
  resume,
  isLoading,
  onFileSelect,
  onResumeTextChange,
  onSectionChange,
  onLoadSample,
  onLoadProfile,
  isLoggedIn,
}: ResumePanelProps) {
  const [showAllSkills, setShowAllSkills] = useState(false);

  return (
    <div className="glass-card flex flex-col gap-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: 'var(--accent-subtle)' }}>
            <svg className="w-4.5 h-4.5" style={{ color: 'var(--accent)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <div>
            <h2 className="text-base font-bold" style={{ color: 'var(--text-heading)' }}>Upload Your Resume</h2>
            <p className="text-xs text-[var(--text-muted)] mt-0.5">PDF, DOCX, or paste text</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {isLoggedIn && (
            <button onClick={onLoadProfile} className="btn-secondary" id="load-profile-resume">
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0zm6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Use My Profile
            </button>
          )}
          <button onClick={onLoadSample} className="btn-secondary" id="load-sample-resume">
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
            </svg>
            Load Sample
          </button>
        </div>
      </div>

      {/* File Upload */}
      <FileUpload onFileSelect={onFileSelect} isLoading={isLoading} />

      {/* Text Fallback */}
      <div>
        <label className="section-label">Or paste resume text</label>
        <textarea
          className="input-field min-h-[140px] resize-y text-sm"
          placeholder="Paste your full resume here..."
          value={resume?.raw_text || ''}
          onChange={(e) => onResumeTextChange(e.target.value)}
          id="resume-text-input"
        />
      </div>

      {/* Skills Found (compact) */}
      {resume && resume.skills_found && resume.skills_found.length > 0 && (
        <div className="animate-fade-in">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs font-semibold" style={{ color: 'var(--accent)' }}>
              {resume.skills_found.length} skills detected
            </span>
            <div className="h-px flex-1" style={{ background: 'var(--border-color)' }} />
          </div>
          <div className="flex flex-wrap gap-1.5">
            {resume.skills_found.slice(0, showAllSkills ? undefined : 15).map((skill) => (
              <span key={skill} className="chip chip-info text-xs">
                {skill}
              </span>
            ))}
            {!showAllSkills && resume.skills_found.length > 15 && (
              <button 
                onClick={() => setShowAllSkills(true)}
                className="chip chip-neutral text-xs cursor-pointer hover:bg-black/10 transition-colors"
              >
                +{resume.skills_found.length - 15} more
              </button>
            )}
            {showAllSkills && resume.skills_found.length > 15 && (
              <button 
                onClick={() => setShowAllSkills(false)}
                className="chip chip-neutral text-xs cursor-pointer hover:bg-black/10 transition-colors"
              >
                Show less
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
