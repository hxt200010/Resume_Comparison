'use client';

import React from 'react';

interface AnalyzeButtonProps {
  onClick: () => void;
  isLoading: boolean;
  disabled: boolean;
}

export default function AnalyzeButton({ onClick, isLoading, disabled }: AnalyzeButtonProps) {
  return (
    <div className="flex flex-col items-center gap-3 py-2">
      <button
        onClick={onClick}
        disabled={disabled || isLoading}
        className="btn-analyze"
        id="analyze-button"
      >
        {isLoading ? (
          <>
            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            <span>Analyzing Resume...</span>
          </>
        ) : (
          <>
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
            <span>Analyze Match</span>
          </>
        )}
      </button>
      {disabled && !isLoading && (
        <p className="text-xs text-[var(--text-muted)]">
          Add your resume and job description to get started
        </p>
      )}
    </div>
  );
}
