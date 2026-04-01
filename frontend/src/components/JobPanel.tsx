'use client';

import React, { useState } from 'react';
import { JobDescriptionInput } from '../lib/types';
import { extractJob } from '../lib/api';

interface JobPanelProps {
  job: JobDescriptionInput;
  onJobChange: (updates: Partial<JobDescriptionInput>) => void;
  onLoadSample: () => void;
}

export default function JobPanel({
  job,
  onJobChange,
  onLoadSample,
}: JobPanelProps) {
  const [viewMode, setViewMode] = useState<'manual' | 'ai_paste'>('manual');
  const [rawText, setRawText] = useState('');
  const [isExtracting, setIsExtracting] = useState(false);

  const handleSkillsChange = (field: 'required_skills' | 'preferred_skills', value: string) => {
    const skills = value.split(',').map(s => s.trim()).filter(Boolean);
    onJobChange({ [field]: skills });
  };

  const handleExtract = async () => {
    if (!rawText.trim()) return;
    setIsExtracting(true);
    try {
      const extractedJob = await extractJob(rawText);
      onJobChange(extractedJob);
      setViewMode('manual');
      setRawText('');
    } catch (e) {
      alert("Failed to auto-fill job details. Verify API key.");
      console.error(e);
    } finally {
      setIsExtracting(false);
    }
  };

  return (
    <div className="glass-card flex flex-col gap-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: 'var(--accent-subtle)' }}>
            <svg className="w-4.5 h-4.5" style={{ color: 'var(--accent)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>
          <div>
            <h2 className="text-base font-bold" style={{ color: 'var(--text-heading)' }}>Job Description</h2>
            <p className="text-xs text-[var(--text-muted)] mt-0.5">Paste the job posting details</p>
          </div>
        </div>
        <div className="flex gap-2 relative">
          <button onClick={onLoadSample} className="btn-secondary" id="load-sample-job" disabled={isExtracting}>
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
            </svg>
            Load Sample
          </button>
        </div>
      </div>

      {/* Toggle View */}
      <div className="flex p-1 bg-black/5 dark:bg-white/5 rounded-lg border" style={{ borderColor: 'var(--border-color)' }}>
        <button
          className={`flex-1 py-1.5 text-xs font-semibold rounded-md transition-all ${viewMode === 'manual' ? 'shadow-sm' : 'opacity-60 hover:opacity-100'}`}
          style={{ background: viewMode === 'manual' ? 'var(--bg-card)' : 'transparent', color: viewMode === 'manual' ? 'var(--text-primary)' : 'var(--text-muted)' }}
          onClick={() => setViewMode('manual')}
        >
          Manual Entry
        </button>
        <button
          className={`flex-1 py-1.5 text-xs font-semibold rounded-md transition-all flex items-center justify-center gap-1.5 ${viewMode === 'ai_paste' ? 'shadow-sm' : 'opacity-60 hover:opacity-100'}`}
          style={{ background: viewMode === 'ai_paste' ? 'var(--bg-card)' : 'transparent', color: viewMode === 'ai_paste' ? 'var(--accent)' : 'var(--text-muted)' }}
          onClick={() => setViewMode('ai_paste')}
        >
          ✨ AI Auto-Fill
        </button>
      </div>

      {viewMode === 'ai_paste' ? (
        <div className="animate-fade-in space-y-4">
          <div>
            <label className="section-label flex justify-between">
              Paste Raw Job Posting
              <span className="text-[10px] font-normal lowercase tracking-wider text-[var(--text-muted)]">LinkedIn, Indeed, etc.</span>
            </label>
            <textarea
              className="input-field min-h-[300px] resize-y text-sm font-mono"
              placeholder="Paste the entire text from the job posting page here. We'll extract the title, company, requirements, and minimum experience for you..."
              value={rawText}
              onChange={(e) => setRawText(e.target.value)}
              disabled={isExtracting}
            />
          </div>
          <button 
            onClick={handleExtract} 
            disabled={!rawText.trim() || isExtracting}
            className="btn-primary w-full justify-center"
          >
            {isExtracting ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Extracting Details...
              </>
            ) : (
              '✨ Extract Job Details'
            )}
          </button>
        </div>
      ) : (
        <div className="animate-fade-in space-y-5">
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
              className="input-field min-h-[160px] resize-y text-sm"
              placeholder="Paste the full job description here..."
              value={job.description}
              onChange={(e) => onJobChange({ description: e.target.value })}
              id="job-description-input"
            />
          </div>

          {/* Required & Preferred Skills */}
          <div className="space-y-3">
            <div>
              <label className="section-label">
                Required Skills <span className="text-[var(--text-muted)] font-normal normal-case tracking-normal">(comma-separated)</span>
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
                Preferred Skills <span className="text-[var(--text-muted)] font-normal normal-case tracking-normal">(comma-separated)</span>
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
        </div>
      )}
    </div>
  );
}
