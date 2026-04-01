'use client';

import React from 'react';
import { ParsedResume, ParsedSections } from '../lib/types';
import FileUpload from './FileUpload';

interface ResumePanelProps {
  resume: ParsedResume | null;
  isLoading: boolean;
  onFileSelect: (file: File) => void;
  onResumeTextChange: (text: string) => void;
  onSectionChange: (section: keyof ParsedSections, value: string) => void;
  onLoadSample: () => void;
}

const SECTION_ICONS: Record<string, string> = {
  contact: '👤',
  summary: '📝',
  skills: '⚡',
  experience: '💼',
  education: '🎓',
  projects: '🚀',
  certifications: '📜',
};

const SECTION_LABELS: Record<string, string> = {
  contact: 'Contact Info',
  summary: 'Summary',
  skills: 'Skills',
  experience: 'Experience',
  education: 'Education',
  projects: 'Projects',
  certifications: 'Certifications',
};

export default function ResumePanel({
  resume,
  isLoading,
  onFileSelect,
  onResumeTextChange,
  onSectionChange,
  onLoadSample,
}: ResumePanelProps) {
  return (
    <div className="glass-card flex flex-col gap-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <span className="w-8 h-8 rounded-lg bg-indigo-500/20 flex items-center justify-center text-sm">📄</span>
            Resume
          </h2>
          <p className="text-xs text-slate-500 mt-1">Upload your resume or paste text</p>
        </div>
        <button onClick={onLoadSample} className="btn-secondary text-xs" id="load-sample-resume">
          Load Sample
        </button>
      </div>

      {/* File Upload */}
      <FileUpload onFileSelect={onFileSelect} isLoading={isLoading} />

      {/* Raw Text Input (fallback / edit) */}
      <div>
        <label className="section-label">Resume Text</label>
        <textarea
          className="input-field min-h-[120px] resize-y text-xs leading-relaxed"
          placeholder="Or paste your resume text here..."
          value={resume?.raw_text || ''}
          onChange={(e) => onResumeTextChange(e.target.value)}
          id="resume-text-input"
        />
      </div>

      {/* Parsed Sections */}
      {resume && resume.raw_text && (
        <div className="space-y-3 animate-fade-in-up">
          <div className="flex items-center gap-2 mb-2">
            <div className="h-px flex-1 bg-gradient-to-r from-indigo-500/20 to-transparent" />
            <span className="text-xs font-semibold text-indigo-400 uppercase tracking-widest">Parsed Sections</span>
            <div className="h-px flex-1 bg-gradient-to-l from-indigo-500/20 to-transparent" />
          </div>

          {/* Skills Found Badges */}
          {resume.skills_found && resume.skills_found.length > 0 && (
            <div className="p-3 rounded-xl bg-indigo-500/5 border border-indigo-500/10">
              <p className="text-xs font-medium text-indigo-400 mb-2">
                {resume.skills_found.length} Skills Detected
              </p>
              <div className="flex flex-wrap gap-1.5">
                {resume.skills_found.map((skill) => (
                  <span key={skill} className="badge badge-info text-[10px]">
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Editable Sections */}
          <div className="stagger-children space-y-2">
            {(Object.keys(SECTION_LABELS) as Array<keyof ParsedSections>).map((key) => {
              const value = resume.sections[key];
              if (!value) return null;
              return (
                <details key={key} className="group">
                  <summary className="flex items-center gap-2 cursor-pointer p-2 rounded-lg hover:bg-white/5 transition-colors">
                    <span className="text-sm">{SECTION_ICONS[key]}</span>
                    <span className="text-xs font-medium text-slate-300">{SECTION_LABELS[key]}</span>
                    <span className="ml-auto text-[10px] text-slate-600">
                      {value.length > 50 ? `${value.slice(0, 50).split(' ').slice(0, -1).join(' ')}...` : value}
                    </span>
                    <svg className="w-3 h-3 text-slate-500 transition-transform group-open:rotate-180" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </summary>
                  <textarea
                    className="input-field mt-2 min-h-[80px] text-xs"
                    value={value}
                    onChange={(e) => onSectionChange(key, e.target.value)}
                  />
                </details>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
