'use client';

import React from 'react';
import { TailorResult } from '../lib/types';

interface TailorPanelProps {
  tailorResult: TailorResult | null;
  isLoading: boolean;
  onTailor: () => void;
  missingSkillsCount: number;
}

export default function TailorPanel({
  tailorResult,
  isLoading,
  onTailor,
  missingSkillsCount,
}: TailorPanelProps) {
  if (missingSkillsCount === 0 && !tailorResult && !isLoading) {
    return null; // Don't show if there's nothing to tailor
  }

  return (
    <div className="result-card result-card-full animate-fade-in-up mt-6 border-2" style={{ borderColor: 'var(--accent-subtle)' }}>
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-bold" style={{ color: 'var(--text-heading)' }}>
              ✨ Magic Tailor
            </h3>
            <span className="chip chip-info text-[10px] py-0 uppercase tracking-wider font-bold">AI Powered</span>
          </div>
          <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
            Automatically rewrite your resume bullet points to naturally highlight missing required skills.
          </p>
        </div>

        <button
          onClick={onTailor}
          disabled={isLoading}
          className="btn-primary flex-shrink-0"
        >
          {isLoading ? (
            <>
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Tailoring...
            </>
          ) : (
            <>
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
              </svg>
              Rewrite Resume
            </>
          )}
        </button>
      </div>

      {tailorResult && (
        <div className="mt-6 pt-6 border-t animate-fade-in" style={{ borderColor: 'var(--border-color)' }}>
          
          <div className="mb-6">
            <h4 className="text-sm font-semibold mb-2 uppercase tracking-wider" style={{ color: 'var(--accent)' }}>
              Tailored Professional Summary
            </h4>
            <div className="p-4 rounded-lg" style={{ background: 'var(--bg-secondary)' }}>
              <p className="text-sm leading-relaxed" style={{ color: 'var(--text-primary)' }}>
                {tailorResult.professional_summary}
              </p>
            </div>
          </div>

          <div>
            <h4 className="text-sm font-semibold mb-3 uppercase tracking-wider" style={{ color: 'var(--accent)' }}>
              Tailored Experience Bullet Points
            </h4>
            
            {tailorResult.experience_bullets.length === 0 ? (
              <p className="text-sm text-center py-4 italic" style={{ color: 'var(--text-muted)' }}>
                No experience bullet points could be naturally modified.
              </p>
            ) : (
              <div className="space-y-4">
                {tailorResult.experience_bullets.map((bullet, idx) => (
                  <div key={idx} className="p-4 border rounded-lg" style={{ borderColor: 'var(--border-color)', background: 'var(--bg-card)' }}>
                    {/* Tags */}
                    {bullet.injected_skills.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mb-2.5">
                        <span className="text-[10px] font-bold uppercase" style={{ color: 'var(--text-muted)' }}>Added:</span>
                        {bullet.injected_skills.map((skill) => (
                          <span key={skill} className="chip chip-success text-[10px] py-0">{skill}</span>
                        ))}
                      </div>
                    )}
                    
                    {/* Rewrite compare */}
                    <div className="space-y-2">
                      <div className="flex gap-2 text-sm opacity-60">
                        <span className="flex-shrink-0 text-[10px] uppercase font-bold tracking-wider pt-0.5 w-14" style={{ color: 'var(--danger)' }}>Before:</span>
                        <p className="line-through" style={{ color: 'var(--text-secondary)' }}>{bullet.original}</p>
                      </div>
                      <div className="flex gap-2 text-sm">
                        <span className="flex-shrink-0 text-[10px] uppercase font-bold tracking-wider pt-0.5 w-14" style={{ color: 'var(--success)' }}>After:</span>
                        <p className="font-medium" style={{ color: 'var(--text-primary)' }}>{bullet.tailored}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
