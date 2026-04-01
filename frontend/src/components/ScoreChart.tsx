'use client';

import React from 'react';
import { AnalysisResult } from '../lib/types';

interface ScoreChartProps {
  result: AnalysisResult;
}

interface ScoreBarProps {
  label: string;
  score: number;
  color: string;
  delay?: number;
}

function ScoreBar({ label, score, color, delay = 0 }: ScoreBarProps) {
  return (
    <div className="animate-fade-in-up" style={{ animationDelay: `${delay}ms` }}>
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-xs font-medium text-slate-300">{label}</span>
        <span className="text-xs font-bold text-white">{Math.round(score)}%</span>
      </div>
      <div className="progress-bar">
        <div
          className="progress-bar-fill"
          style={{
            width: `${score}%`,
            background: color,
            animationDelay: `${delay}ms`,
          }}
        />
      </div>
    </div>
  );
}

function ScoreCircle({ score, recommendation }: { score: number; recommendation: string }) {
  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;

  const getColor = () => {
    if (score >= 75) return '#22c55e';
    if (score >= 50) return '#6366f1';
    if (score >= 25) return '#f59e0b';
    return '#ef4444';
  };

  const getBadgeClass = () => {
    if (recommendation.includes('Strong')) return 'badge-success';
    if (recommendation.includes('Moderate')) return 'badge-info';
    if (recommendation.includes('Weak')) return 'badge-warning';
    return 'badge-danger';
  };

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="relative w-36 h-36">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
          {/* Background circle */}
          <circle
            cx="60" cy="60" r={radius}
            fill="none" stroke="rgba(99, 102, 241, 0.1)" strokeWidth="8"
          />
          {/* Score arc */}
          <circle
            cx="60" cy="60" r={radius}
            fill="none"
            stroke={getColor()}
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            style={{
              transition: 'stroke-dashoffset 1.5s cubic-bezier(0.4, 0, 0.2, 1)',
              filter: `drop-shadow(0 0 8px ${getColor()}40)`,
            }}
          />
        </svg>
        {/* Score number */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-3xl font-extrabold text-white">{Math.round(score)}</span>
          <span className="text-[10px] text-slate-500 uppercase tracking-wider">Score</span>
        </div>
      </div>
      <span className={`badge ${getBadgeClass()} text-xs`}>
        {recommendation}
      </span>
    </div>
  );
}

export default function ScoreChart({ result }: ScoreChartProps) {
  const breakdown = result.score_breakdown;

  const bars = [
    { label: 'Required Skills', score: breakdown.required_skills_score, color: 'linear-gradient(90deg, #6366f1, #8b5cf6)' },
    { label: 'Experience', score: breakdown.experience_score, color: 'linear-gradient(90deg, #06b6d4, #22d3ee)' },
    { label: 'Preferred Skills', score: breakdown.preferred_skills_score, color: 'linear-gradient(90deg, #8b5cf6, #a855f7)' },
    { label: 'Keyword Match', score: breakdown.keyword_match_score, color: 'linear-gradient(90deg, #3b82f6, #60a5fa)' },
    { label: 'Education', score: breakdown.education_score, color: 'linear-gradient(90deg, #22c55e, #4ade80)' },
    { label: 'Projects', score: breakdown.projects_score, color: 'linear-gradient(90deg, #f59e0b, #fbbf24)' },
    { label: 'Completeness', score: breakdown.completeness_score, color: 'linear-gradient(90deg, #ec4899, #f472b6)' },
  ];

  return (
    <div className="glass-card">
      <div className="flex flex-col lg:flex-row items-center lg:items-start gap-8">
        {/* Overall Score Circle */}
        <div className="flex-shrink-0">
          <ScoreCircle score={result.overall_score} recommendation={result.recommendation} />
          <div className="mt-3 text-center">
            <p className="text-[10px] text-slate-500">
              Confidence: {Math.round(result.confidence)}%
            </p>
          </div>
        </div>

        {/* Score Bars */}
        <div className="flex-1 w-full space-y-3">
          <h3 className="text-sm font-semibold text-white mb-4">Score Breakdown</h3>
          {bars.map((bar, i) => (
            <ScoreBar key={bar.label} {...bar} delay={i * 100} />
          ))}
        </div>
      </div>
    </div>
  );
}
