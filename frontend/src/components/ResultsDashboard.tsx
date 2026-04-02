'use client';

import React, { useState } from 'react';
import { AnalysisResult, ParsedResume, JobDescriptionInput, TailorResult } from '../lib/types';
import { tailorResume } from '../lib/api';
import TailorPanel from './TailorPanel';
import CoverLetterTailor from './CoverLetterTailor';

interface ResultsDashboardProps {
  result: AnalysisResult;
  resume: ParsedResume;
  job: JobDescriptionInput;
}

/* ─── Score Card ──────────────────────────────────── */
function ScoreCard({ score, recommendation, explanation, confidence }: {
  score: number; recommendation: string; explanation: string; confidence: number;
}) {
  const [isExpanded, setIsExpanded] = React.useState(false);
  const radius = 70;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;

  const getColor = () => {
    if (score >= 75) return 'var(--score-high)';
    if (score >= 50) return 'var(--score-mid)';
    if (score >= 25) return 'var(--score-low)';
    return 'var(--score-fail)';
  };

  const getScoreBg = () => {
    if (score >= 75) return 'var(--success-bg)';
    if (score >= 50) return 'var(--accent-subtle)';
    if (score >= 25) return 'var(--warning-bg)';
    return 'var(--danger-bg)';
  };

  const getBadgeClass = () => {
    if (recommendation.includes('Strong')) return 'chip-success';
    if (recommendation.includes('Moderate')) return 'chip-info';
    if (recommendation.includes('Weak')) return 'chip-warning';
    return 'chip-danger';
  };

  const getSubtext = () => {
    if (score >= 75) return 'Excellent match — your resume aligns strongly with this role.';
    if (score >= 50) return 'Good alignment, but some key areas need attention.';
    if (score >= 25) return 'Partial match — several important skills are missing.';
    return 'Low alignment — significant gaps between your resume and this role.';
  };

  const color = getColor();

  return (
    <div className="result-card result-card-full animate-scale-in" style={{ background: getScoreBg() }}>
      <div className="flex flex-col md:flex-row items-center gap-8">
        {/* Score Ring */}
        <div className="flex-shrink-0">
          <div className="score-ring-container">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 160 160">
              <circle
                cx="80" cy="80" r={radius}
                fill="none" stroke="var(--border-color)" strokeWidth="8"
              />
              <circle
                cx="80" cy="80" r={radius}
                fill="none"
                stroke={color}
                strokeWidth="8"
                strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={offset}
                style={{
                  transition: 'stroke-dashoffset 1.2s ease',
                }}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="score-number animate-count-up" style={{ color }}>{Math.round(score)}</span>
              <span className="score-label">Match Score</span>
            </div>
          </div>
        </div>

        {/* Info */}
        <div className="flex-1 text-center md:text-left">
          <div className="mb-3">
            <span className={`chip ${getBadgeClass()} text-sm`}>
              {recommendation}
            </span>
          </div>
          <p className="text-base leading-relaxed mb-3" style={{ color: 'var(--text-primary)' }}>
            {getSubtext()}
          </p>
          {explanation && (
            <div className="mb-3">
              <p className={`text-sm leading-relaxed ${isExpanded ? '' : 'line-clamp-3'}`} style={{ color: 'var(--text-secondary)' }}>
                {explanation}
              </p>
              {explanation.length > 120 && (
                <button 
                  onClick={() => setIsExpanded(!isExpanded)}
                  style={{
                    background: 'none', border: 'none', padding: 0, marginTop: '0.25rem',
                    color: 'var(--accent)', fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer'
                  }}
                >
                  {isExpanded ? 'Show less' : 'Read more'}
                </button>
              )}
            </div>
          )}
          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
            Confidence: {Math.round(confidence)}%
          </p>
        </div>
      </div>
    </div>
  );
}

/* ─── Strengths Card ─────────────────────────────── */
function StrengthsCard({ skills }: { skills: string[] }) {
  if (skills.length === 0) return null;

  return (
    <div className="result-card animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
      <div className="result-card-header">
        <div className="result-card-icon" style={{ background: 'var(--success-bg)', color: 'var(--success)' }}>
          <span>✓</span>
        </div>
        <div>
          <h3 className="result-card-title flex items-center gap-2">Strengths <span className="chip chip-success text-[10px] py-0">{skills.length} skills</span></h3>
        </div>
      </div>
      <div className="flex flex-wrap gap-2">
        {skills.map((skill) => (
          <span key={skill} className="chip chip-success">
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
            </svg>
            {skill}
          </span>
        ))}
      </div>
    </div>
  );
}

/* ─── Missing Skills Card ────────────────────────── */
function MissingSkillsCard({ requiredMissing, preferredMissing }: {
  requiredMissing: string[]; preferredMissing: string[];
}) {
  if (requiredMissing.length === 0 && preferredMissing.length === 0) return null;

  return (
    <div className="result-card animate-fade-in-up" style={{ animationDelay: '0.15s' }}>
      <div className="result-card-header">
        <div className="result-card-icon" style={{ background: 'var(--danger-bg)', color: 'var(--danger)' }}>
          <span>✗</span>
        </div>
        <div>
          <h3 className="result-card-title flex items-center gap-2">Missing Skills <span className="chip chip-danger text-[10px] py-0">{requiredMissing.length + preferredMissing.length} to improve</span></h3>
        </div>
      </div>

      {requiredMissing.length > 0 && (
        <div className="mb-4">
          <p className="text-xs font-semibold mb-2 uppercase tracking-wider" style={{ color: 'var(--danger)' }}>Required</p>
          <div className="flex flex-wrap gap-2">
            {requiredMissing.map((skill) => (
              <span key={skill} className="chip chip-danger">
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
                </svg>
                {skill}
              </span>
            ))}
          </div>
        </div>
      )}

      {preferredMissing.length > 0 && (
        <div>
          <p className="text-xs font-semibold mb-2 uppercase tracking-wider" style={{ color: 'var(--warning)' }}>Nice to have</p>
          <div className="flex flex-wrap gap-2">
            {preferredMissing.map((skill) => (
              <span key={skill} className="chip chip-warning">
                <svg className="w-3 h-3 opacity-60" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M20 12H4" />
                </svg>
                {skill}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/* ─── Suggestions Card ───────────────────────────── */
function SuggestionsCard({ suggestions }: { suggestions: string[] }) {
  if (suggestions.length === 0) return null;

  return (
    <div className="result-card result-card-full animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
      <div className="result-card-header">
        <div className="result-card-icon" style={{ background: 'var(--warning-bg)', color: 'var(--warning)' }}>
          <span>💡</span>
        </div>
        <h3 className="result-card-title">How to Improve Your Resume</h3>
      </div>
      <div className="space-y-2">
        {suggestions.map((suggestion, i) => (
          <div key={i} className="suggestion-item">
            <div className="suggestion-icon bg-indigo-500/10 text-indigo-400">
              →
            </div>
            <p className="text-sm leading-relaxed" style={{ color: 'var(--text-primary)' }}>{suggestion}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─── Keyword Comparison Card ────────────────────── */
function KeywordComparisonCard({ matched, missingRequired, missingPreferred }: {
  matched: string[]; missingRequired: string[]; missingPreferred: string[];
}) {
  const allMissing = [...missingRequired, ...missingPreferred];
  if (matched.length === 0 && allMissing.length === 0) return null;

  return (
    <div className="result-card result-card-full animate-fade-in-up" style={{ animationDelay: '0.25s' }}>
      <div className="result-card-header">
        <div className="result-card-icon" style={{ background: 'var(--info-bg)', color: 'var(--info)' }}>
          <span>⚡</span>
        </div>
        <h3 className="result-card-title">Keyword Comparison</h3>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Matched side */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <div className="w-2 h-2 rounded-full" style={{ background: 'var(--success)' }} />
            <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--success)' }}>
              Matched Keywords ({matched.length})
            </span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {matched.map((skill) => (
              <span key={skill} className="chip chip-success text-xs">
                {skill}
              </span>
            ))}
            {matched.length === 0 && (
              <span className="text-xs text-[var(--text-muted)]">No matches found</span>
            )}
          </div>
        </div>

        {/* Missing side */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <div className="w-2 h-2 rounded-full" style={{ background: 'var(--danger)' }} />
            <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--danger)' }}>
              Missing Keywords ({allMissing.length})
            </span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {allMissing.map((skill) => (
              <span key={skill} className="chip chip-danger text-xs">
                {skill}
              </span>
            ))}
            {allMissing.length === 0 && (
              <span className="text-xs text-[var(--text-muted)]">None missing!</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── Score Breakdown Card (collapsible) ─────────── */
function ScoreBreakdownCard({ result }: { result: AnalysisResult }) {
  const [expanded, setExpanded] = useState(false);
  const breakdown = result.score_breakdown;

  const rawBars = [
    { label: 'Required Skills', score: breakdown.required_skills_score, weight: '30%' },
    { label: 'Experience', score: breakdown.experience_score, weight: '20%' },
    { label: 'Preferred Skills', score: breakdown.preferred_skills_score, weight: '15%' },
    { label: 'Keyword Match', score: breakdown.keyword_match_score, weight: '10%' },
    { label: 'Education', score: breakdown.education_score, weight: '10%' },
    { label: 'Projects', score: breakdown.projects_score, weight: '10%' },
    { label: 'Completeness', score: breakdown.completeness_score, weight: '5%' },
  ];

  // Divide into Met (score >= 50) and Not Met (score < 50)
  const metBars = rawBars.filter((b) => b.score >= 50);
  const notMetBars = rawBars.filter((b) => b.score < 50);

  return (
    <div className="result-card result-card-full animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between"
        id="breakdown-toggle"
      >
        <div className="result-card-header mb-0">
          <div className="result-card-icon" style={{ background: 'var(--accent-subtle)', color: 'var(--accent)' }}>
            <span>📊</span>
          </div>
          <h3 className="result-card-title">Detailed Score Breakdown</h3>
        </div>
        <svg
          className={`w-5 h-5 text-[var(--text-muted)] transition-transform duration-300 ${expanded ? 'rotate-180' : ''}`}
          fill="none" viewBox="0 0 24 24" stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {expanded && (
        <div className="mt-6 flex flex-col md:flex-row gap-8 animate-fade-in">
          
          {/* ✅ MET SECTION */}
          <div className="flex-1 space-y-6">
            <h4 className="text-sm font-bold uppercase tracking-wider flex items-center gap-2" style={{ color: 'var(--success)' }}>
              <span className="w-2 h-2 rounded-full" style={{ background: 'var(--success)' }} />
              Requirements Met
            </h4>
            
            <div className="space-y-4">
              {metBars.map((bar, i) => (
                <div key={bar.label} className="animate-fade-in-up" style={{ animationDelay: `${i * 60}ms` }}>
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium" style={{ color: 'var(--text-primary)' }}>{bar.label}</span>
                      <span className="text-[10px] text-[var(--text-muted)]">({bar.weight})</span>
                    </div>
                    <span className="text-xs" style={{ color: 'var(--success)' }}>{Math.round(bar.score)}%</span>
                  </div>
                  <div className="progress-bar h-1.5" style={{ background: 'var(--success-bg)' }}>
                    <div
                      className="progress-bar-fill"
                      style={{
                        width: `${bar.score}%`,
                        background: 'var(--success)',
                        animationDelay: `${i * 60}ms`,
                      }}
                    />
                  </div>
                </div>
              ))}
              {metBars.length === 0 && <span className="text-xs text-[var(--text-muted)]">No passing metrics.</span>}
            </div>

            {/* Experience & Projects (Assumed Met if listed) */}
            <div className="space-y-4 pt-2">
              {result.relevant_experience.length > 0 && (
                <div>
                  <h5 className="text-[10px] font-semibold mb-1.5 uppercase tracking-wider" style={{ color: 'var(--success)' }}>Relevant Experience</h5>
                  <ul className="space-y-1">
                    {result.relevant_experience.map((item, i) => (
                      <li key={i} className="text-xs pl-2 border-l-2" style={{ color: 'var(--text-primary)', borderColor: 'var(--success)' }}>{item}</li>
                    ))}
                  </ul>
                </div>
              )}
              {result.relevant_projects.length > 0 && (
                <div>
                  <h5 className="text-[10px] font-semibold mb-1.5 uppercase tracking-wider" style={{ color: 'var(--success)' }}>Relevant Projects</h5>
                  <ul className="space-y-1">
                    {result.relevant_projects.map((item, i) => (
                      <li key={i} className="text-xs pl-2 border-l-2" style={{ color: 'var(--text-primary)', borderColor: 'var(--success)' }}>{item}</li>
                    ))}
                  </ul>
                </div>
              )}
              {result.education_match && (
                <div>
                  <h5 className="text-[10px] font-semibold mb-1.5 uppercase tracking-wider" style={{ color: 'var(--success)' }}>Education</h5>
                  <p className="text-xs" style={{ color: 'var(--text-primary)' }}>{result.education_match}</p>
                </div>
              )}
            </div>
          </div>

          {/* ❌ NOT MET SECTION */}
          <div className="flex-1 space-y-6">
            <h4 className="text-sm font-bold uppercase tracking-wider flex items-center gap-2" style={{ color: 'var(--danger)' }}>
              <span className="w-2 h-2 rounded-full" style={{ background: 'var(--danger)' }} />
              Requirements Not Met
            </h4>
            
            <div className="space-y-4">
              {notMetBars.map((bar, i) => (
                <div key={bar.label} className="animate-fade-in-up" style={{ animationDelay: `${i * 60}ms` }}>
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium" style={{ color: 'var(--text-primary)' }}>{bar.label}</span>
                      <span className="text-[10px] text-[var(--text-muted)]">({bar.weight})</span>
                    </div>
                    <span className="text-xs" style={{ color: 'var(--danger)' }}>{Math.round(bar.score)}%</span>
                  </div>
                  <div className="progress-bar h-1.5" style={{ background: 'var(--danger-bg)' }}>
                    <div
                      className="progress-bar-fill"
                      style={{
                        width: `${bar.score}%`,
                        background: 'var(--danger)',
                        animationDelay: `${i * 60}ms`,
                      }}
                    />
                  </div>
                </div>
              ))}
              {notMetBars.length === 0 && <span className="text-xs text-[var(--text-muted)]">No failing metrics.</span>}
            </div>

            {/* Rejection Flags & Details */}
            <div className="space-y-4 pt-2">
              {result.rejection_reasons.length > 0 && (
                <div>
                  <h5 className="text-[10px] font-semibold mb-1.5 uppercase tracking-wider" style={{ color: 'var(--danger)' }}>Rejection Flags</h5>
                  <div className="p-3 bg-[var(--danger-bg)] border border-[var(--danger-border)] rounded-lg">
                    <ul className="space-y-1.5">
                      {result.rejection_reasons.map((reason, i) => (
                        <li key={i} className="text-xs" style={{ color: 'var(--danger)' }}>• {reason}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}
              {result.missing_required.length > 0 && (
                <div>
                  <h5 className="text-[10px] font-semibold mb-1.5 uppercase tracking-wider" style={{ color: 'var(--danger)' }}>Missing Required Skills</h5>
                  <ul className="space-y-1">
                    {result.missing_required.map((item, i) => (
                      <li key={i} className="text-xs pl-2 border-l-2" style={{ color: 'var(--text-primary)', borderColor: 'var(--danger)' }}>{item}</li>
                    ))}
                  </ul>
                </div>
              )}
              {result.missing_preferred.length > 0 && (
                <div>
                  <h5 className="text-[10px] font-semibold mb-1.5 uppercase tracking-wider" style={{ color: 'var(--warning)' }}>Missing Preferred Skills</h5>
                  <ul className="space-y-1">
                    {result.missing_preferred.map((item, i) => (
                      <li key={i} className="text-xs pl-2 border-l-2" style={{ color: 'var(--text-primary)', borderColor: 'var(--warning)' }}>{item}</li>
                    ))}
                  </ul>
                </div>
              )}
              {result.suggestions.length > 0 && (
                <div className="mt-4">
                  <h5 className="text-[10px] font-semibold mb-1.5 uppercase tracking-wider" style={{ color: 'var(--accent)' }}>Recommendations</h5>
                  <div className="p-3 bg-[var(--bg-secondary)] border rounded-lg" style={{ borderColor: 'var(--accent-subtle)' }}>
                    <ul className="space-y-2">
                      {result.suggestions.map((item, i) => (
                        <li key={i} className="text-xs text-[var(--text-primary)] relative pl-3">
                           <span className="absolute left-0 top-0 text-[var(--accent)]">•</span>
                           {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}
            </div>
          </div>

        </div>
      )}
    </div>
  );
}

/* ─── Main Dashboard ─────────────────────────────── */
export default function ResultsDashboard({ result, resume, job }: ResultsDashboardProps) {
  const [tailorResult, setTailorResult] = useState<TailorResult | null>(null);
  const [isTailoring, setIsTailoring] = useState(false);

  const handleTailor = async () => {
    setIsTailoring(true);
    try {
      const missing = [...result.missing_required, ...result.missing_preferred];
      const res = await tailorResume(resume, job, missing);
      setTailorResult(res);
    } catch (e) {
      alert("Failed to tailor resume. Please check API keys.");
      console.error(e);
    } finally {
      setIsTailoring(false);
    }
  };

  return (
    <div id="results-section">
      {/* Section Header */}
      <div className="section-divider">
        <div className="section-divider-line" />
        <span className="section-divider-text">Analysis Results</span>
        <div className="section-divider-line" />
      </div>

      <div className="results-grid">
        {/* Card 1: Score */}
        <ScoreCard
          score={result.overall_score}
          recommendation={result.recommendation}
          explanation={result.explanation}
          confidence={result.confidence}
        />

        {/* Card 2: Strengths */}
        <StrengthsCard skills={result.matched_skills} />

        {/* Card 3: Missing Skills */}
        <MissingSkillsCard
          requiredMissing={result.missing_required}
          preferredMissing={result.missing_preferred}
        />

        {/* Card 4: Suggestions */}
        <SuggestionsCard suggestions={result.suggestions} />

        {/* Card 5: Keyword Comparison */}
        <KeywordComparisonCard
          matched={result.matched_skills}
          missingRequired={result.missing_required}
          missingPreferred={result.missing_preferred}
        />

        {/* Card 6: Score Breakdown (collapsible) */}
        <ScoreBreakdownCard result={result} />
      </div>

      <TailorPanel
        tailorResult={tailorResult}
        isLoading={isTailoring}
        onTailor={handleTailor}
        missingSkillsCount={result.missing_required.length + result.missing_preferred.length}
        resume={resume}
      />

      {/* Cover Letter Panel */}
      <CoverLetterTailor job={job} resume={resume} />
    </div>
  );
}
