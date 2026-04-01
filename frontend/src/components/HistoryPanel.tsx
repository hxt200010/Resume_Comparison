'use client';

import React from 'react';
import { HistoryEntry } from '../lib/types';

interface HistoryPanelProps {
  history: HistoryEntry[];
  onSelect: (entry: HistoryEntry) => void;
  onDelete: (id: string) => void;
}

export default function HistoryPanel({ history, onSelect, onDelete }: HistoryPanelProps) {
  const [currentPage, setCurrentPage] = React.useState(1);
  const itemsPerPage = 5;
  const totalPages = Math.ceil(history.length / itemsPerPage);
  const currentHistory = history.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const getScoreColor = (score: number) => {
    if (score >= 75) return 'var(--score-high)';
    if (score >= 50) return 'var(--score-mid)';
    if (score >= 25) return 'var(--score-low)';
    return 'var(--score-fail)';
  };

  const getBadgeClass = (rec: string) => {
    if (rec.includes('Strong')) return 'badge-success';
    if (rec.includes('Moderate')) return 'badge-info';
    if (rec.includes('Weak')) return 'badge-warning';
    return 'badge-danger';
  };

  const formatDate = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return dateStr;
    }
  };

  if (history.length === 0) return null;

  return (
    <div id="history-section">
      {/* Section Header */}
      <div className="section-divider">
        <div className="section-divider-line" />
        <span className="section-divider-text">Previous Analyses</span>
        <div className="section-divider-line" />
      </div>

      <div className="space-y-2">
        {currentHistory.map((entry, i) => (
          <div
            key={entry.id}
            className="history-entry group animate-fade-in-up"
            style={{ animationDelay: `${i * 50}ms` }}
            onClick={() => onSelect(entry)}
          >
            {/* Score */}
            <div className="flex-shrink-0 w-14 text-center">
              <span className={`text-xl font-extrabold`} style={{ color: getScoreColor(entry.overall_score) }}>
                {Math.round(entry.overall_score)}
              </span>
              <p className="text-[9px] text-[var(--text-muted)] uppercase tracking-wider mt-0.5">Score</p>
            </div>

            {/* Vertical divider */}
            <div className="w-px h-10 flex-shrink-0" style={{ background: 'var(--border-color)' }} />

            {/* Details */}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate" style={{ color: 'var(--text-heading)' }}>
                {entry.job_title || 'Untitled'} {entry.company ? `at ${entry.company}` : ''}
              </p>
              <div className="flex items-center gap-2 mt-1">
                <span className={`badge ${getBadgeClass(entry.recommendation)} text-[10px] py-0`}>
                  {entry.recommendation}
                </span>
                <span className="text-[10px] text-[var(--text-muted)]">
                  {entry.resume_name}
                </span>
              </div>
            </div>

            {/* Date & Delete */}
            <div className="flex items-center gap-3 flex-shrink-0">
              <span className="text-[11px] text-[var(--text-muted)]">
                {entry.created_at ? formatDate(entry.created_at) : ''}
              </span>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(entry.id);
                }}
                className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg transition-all"
                style={{ color: 'var(--danger)' }}
                title="Delete"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </div>
          </div>
        ))}
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-4 px-2">
          <span className="text-xs text-[var(--text-muted)]">
            Page {currentPage} of {totalPages}
          </span>
          <div className="flex gap-2">
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="px-3 py-1 rounded text-xs font-medium bg-[var(--bg-secondary)] text-[var(--text-secondary)] hover:bg-[var(--border-color)] disabled:opacity-50 transition-colors"
            >
              Previous
            </button>
            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="px-3 py-1 rounded text-xs font-medium bg-[var(--bg-secondary)] text-[var(--text-secondary)] hover:bg-[var(--border-color)] disabled:opacity-50 transition-colors"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
