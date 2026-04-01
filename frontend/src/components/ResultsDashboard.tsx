'use client';

import React from 'react';
import { AnalysisResult } from '../lib/types';
import ScoreChart from './ScoreChart';

interface ResultsDashboardProps {
  result: AnalysisResult;
}

function SkillsList({ title, skills, type }: { title: string; skills: string[]; type: 'matched' | 'missing-required' | 'missing-preferred' }) {
  if (skills.length === 0) return null;

  const badgeClass = type === 'matched' ? 'badge-success' : type === 'missing-required' ? 'badge-danger' : 'badge-warning';
  const icon = type === 'matched' ? '✓' : '✗';

  return (
    <div>
      <h4 className="text-xs font-semibold text-slate-400 mb-2">{title}</h4>
      <div className="flex flex-wrap gap-1.5">
        {skills.map((skill) => (
          <span key={skill} className={`badge ${badgeClass} text-[10px]`}>
            {icon} {skill}
          </span>
        ))}
      </div>
    </div>
  );
}

function SnippetList({ title, icon, items }: { title: string; icon: string; items: string[] }) {
  if (items.length === 0) return null;

  return (
    <div>
      <h4 className="text-xs font-semibold text-slate-400 mb-2 flex items-center gap-1.5">
        <span>{icon}</span> {title}
      </h4>
      <ul className="space-y-1.5">
        {items.map((item, i) => (
          <li key={i} className="text-xs text-slate-300 pl-3 border-l-2 border-indigo-500/30 py-1">
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function ResultsDashboard({ result }: ResultsDashboardProps) {
  return (
    <div className="space-y-6 animate-fade-in-up">
      {/* Section Divider */}
      <div className="flex items-center gap-3">
        <div className="h-px flex-1 bg-gradient-to-r from-transparent via-indigo-500/30 to-transparent" />
        <h2 className="text-lg font-bold text-white flex items-center gap-2">
          <span className="w-8 h-8 rounded-lg bg-green-500/20 flex items-center justify-center text-sm">📊</span>
          Analysis Results
        </h2>
        <div className="h-px flex-1 bg-gradient-to-r from-transparent via-indigo-500/30 to-transparent" />
      </div>

      {/* Score Chart */}
      <ScoreChart result={result} />

      {/* Skills Analysis */}
      <div className="glass-card space-y-4">
        <h3 className="text-sm font-semibold text-white flex items-center gap-2">
          <span className="text-indigo-400">⚡</span> Skills Analysis
        </h3>
        <SkillsList title="Matched Skills" skills={result.matched_skills} type="matched" />
        <SkillsList title="Missing Required Skills" skills={result.missing_required} type="missing-required" />
        <SkillsList title="Missing Preferred Skills" skills={result.missing_preferred} type="missing-preferred" />
      </div>

      {/* Experience & Projects */}
      {(result.relevant_experience.length > 0 || result.relevant_projects.length > 0) && (
        <div className="glass-card space-y-4">
          <h3 className="text-sm font-semibold text-white flex items-center gap-2">
            <span className="text-cyan-400">🔍</span> Relevant Matches Found
          </h3>
          <SnippetList title="Relevant Experience" icon="💼" items={result.relevant_experience} />
          <SnippetList title="Relevant Projects" icon="🚀" items={result.relevant_projects} />
          {result.education_match && (
            <div>
              <h4 className="text-xs font-semibold text-slate-400 mb-1 flex items-center gap-1.5">
                <span>🎓</span> Education
              </h4>
              <p className="text-xs text-slate-300">{result.education_match}</p>
            </div>
          )}
        </div>
      )}

      {/* Rejection Reasons */}
      {result.rejection_reasons.length > 0 && (
        <div className="glass-card border-red-500/20">
          <h3 className="text-sm font-semibold text-red-400 flex items-center gap-2 mb-3">
            <span>⚠️</span> Rejection Flags
          </h3>
          <ul className="space-y-2">
            {result.rejection_reasons.map((reason, i) => (
              <li key={i} className="text-xs text-red-300/80 pl-3 border-l-2 border-red-500/30 py-1">
                {reason}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Explanation */}
      <div className="glass-card">
        <h3 className="text-sm font-semibold text-white flex items-center gap-2 mb-3">
          <span className="text-violet-400">💡</span> ATS Analysis Explanation
        </h3>
        <div className="text-xs text-slate-300 leading-relaxed whitespace-pre-line">
          {result.explanation}
        </div>
      </div>

      {/* Improvement Suggestions */}
      {result.suggestions.length > 0 && (
        <div className="glass-card">
          <h3 className="text-sm font-semibold text-white flex items-center gap-2 mb-3">
            <span className="text-amber-400">✨</span> Improvement Suggestions
          </h3>
          <ul className="space-y-2">
            {result.suggestions.map((suggestion, i) => (
              <li key={i} className="flex items-start gap-2 text-xs text-slate-300">
                <span className="text-indigo-400 mt-0.5 flex-shrink-0">→</span>
                {suggestion}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
