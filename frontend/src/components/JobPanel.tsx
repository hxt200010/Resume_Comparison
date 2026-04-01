'use client';

import React from 'react';
import { JobDescriptionInput } from '../lib/types';

interface JobPanelProps {
  job: JobDescriptionInput;
  onJobChange: (updates: Partial<JobDescriptionInput>) => void;
  onAnalyze: () => void;
  onLoadSample: () => void;
  isLoading: boolean;
  canAnalyze: boolean;
}

export default function JobPanel({
  job,
  onJobChange,
  onAnalyze,
  onLoadSample,
  isLoading,
  canAnalyze,
}: JobPanelProps) {
  const handleSkillsChange = (field: 'required_skills' | 'preferred_skills', value: string) => {
    const skills = value.split(',').map(s => s.trim()).filter(Boolean);
    onJobChange({ [field]: skills });
  };

  return (
    <div className="glass-card flex flex-col gap-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <span className="w-8 h-8 rounded-lg bg-violet-500/20 flex items-center justify-center text-sm">💼</span>
            Job Description
          </h2>
          <p className="text-xs text-slate-500 mt-1">Paste the job posting details</p>
        </div>
        <button onClick={onLoadSample} className="btn-secondary text-xs" id="load-sample-job">
          Load Sample
        </button>
      </div>

      {/* Job Title & Company */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="section-label">Job Title</label>
          <input
            type="text"
            className="input-field"
            placeholder="e.g., Software Engineer"
            value={job.title}
            onChange={(e) => onJobChange({ title: e.target.value })}
            id="job-title-input"
          />
        </div>
        <div>
          <label className="section-label">Company</label>
          <input
            type="text"
            className="input-field"
            placeholder="e.g., Google"
            value={job.company}
            onChange={(e) => onJobChange({ company: e.target.value })}
            id="job-company-input"
          />
        </div>
      </div>

      {/* Job Description */}
      <div>
        <label className="section-label">Description</label>
        <textarea
          className="input-field min-h-[160px] resize-y text-xs leading-relaxed"
          placeholder="Paste the full job description here..."
          value={job.description}
          onChange={(e) => onJobChange({ description: e.target.value })}
          id="job-description-input"
        />
      </div>

      {/* Required & Preferred Skills */}
      <div className="grid grid-cols-1 gap-3">
        <div>
          <label className="section-label">
            Required Skills <span className="text-slate-600 font-normal">(comma-separated)</span>
          </label>
          <input
            type="text"
            className="input-field"
            placeholder="e.g., React, Python, SQL, Docker"
            value={job.required_skills.join(', ')}
            onChange={(e) => handleSkillsChange('required_skills', e.target.value)}
            id="required-skills-input"
          />
        </div>
        <div>
          <label className="section-label">
            Preferred Skills <span className="text-slate-600 font-normal">(comma-separated)</span>
          </label>
          <input
            type="text"
            className="input-field"
            placeholder="e.g., AWS, GraphQL, CI/CD"
            value={job.preferred_skills.join(', ')}
            onChange={(e) => handleSkillsChange('preferred_skills', e.target.value)}
            id="preferred-skills-input"
          />
        </div>
      </div>

      {/* Experience & Education */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="section-label">Min Experience (years)</label>
          <input
            type="number"
            className="input-field"
            placeholder="0"
            min={0}
            max={30}
            value={job.min_experience || ''}
            onChange={(e) => onJobChange({ min_experience: parseInt(e.target.value) || 0 })}
            id="min-experience-input"
          />
        </div>
        <div>
          <label className="section-label">Degree Required</label>
          <input
            type="text"
            className="input-field"
            placeholder="e.g., Bachelor's in CS"
            value={job.degree_required}
            onChange={(e) => onJobChange({ degree_required: e.target.value })}
            id="degree-input"
          />
        </div>
      </div>

      {/* Analyze Button */}
      <button
        onClick={onAnalyze}
        disabled={!canAnalyze || isLoading}
        className="btn-primary w-full flex items-center justify-center gap-2 mt-2"
        id="analyze-button"
      >
        {isLoading ? (
          <>
            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            Analyzing...
          </>
        ) : (
          <>
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
            Analyze Match
          </>
        )}
      </button>
    </div>
  );
}
