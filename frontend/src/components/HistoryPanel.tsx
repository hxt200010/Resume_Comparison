'use client';

import React from 'react';
import { HistoryEntry } from '../lib/types';

interface HistoryPanelProps {
  history: HistoryEntry[];
  onSelect: (entry: HistoryEntry) => void;
  onDelete: (id: string) => void;
  isOpen: boolean;
  onToggle: () => void;
}

export default function HistoryPanel({ history, onSelect, onDelete, isOpen, onToggle }: HistoryPanelProps) {
  const getScoreColor = (score: number) => {
    if (score >= 75) return 'text-green-400';
    if (score >= 50) return 'text-indigo-400';
    if (score >= 25) return 'text-amber-400';
    return 'text-red-400';
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

  return (
    <div className="glass-card">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between"
        id="history-toggle"
      >
        <h2 className="text-sm font-bold text-white flex items-center gap-2">
          <span className="w-7 h-7 rounded-lg bg-cyan-500/20 flex items-center justify-center text-xs">📋</span>
          Analysis History
          {history.length > 0 && (
            <span className="badge badge-neutral text-[10px]">{history.length}</span>
          )}
        </h2>
        <svg
          className={`w-4 h-4 text-slate-400 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}
          fill="none" viewBox="0 0 24 24" stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div className="mt-4 space-y-2 animate-fade-in">
          {history.length === 0 ? (
            <p className="text-xs text-slate-500 text-center py-4">
              No analyses yet. Results will appear here after your first analysis.
            </p>
          ) : (
            history.map((entry) => (
              <div
                key={entry.id}
                className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.02] hover:bg-white/[0.05] border border-white/[0.03] hover:border-indigo-500/20 transition-all cursor-pointer group"
                onClick={() => onSelect(entry)}
              >
                {/* Score */}
                <span className={`text-lg font-bold ${getScoreColor(entry.overall_score)} min-w-[2.5rem] text-center`}>
                  {Math.round(entry.overall_score)}
                </span>

                {/* Details */}
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-slate-200 truncate">
                    {entry.job_title || 'Untitled'} {entry.company ? `@ ${entry.company}` : ''}
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className={`badge ${getBadgeClass(entry.recommendation)} text-[9px] py-0`}>
                      {entry.recommendation}
                    </span>
                    <span className="text-[10px] text-slate-600">
                      {entry.resume_name}
                    </span>
                  </div>
                </div>

                {/* Date & Delete */}
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className="text-[10px] text-slate-600">
                    {entry.created_at ? formatDate(entry.created_at) : ''}
                  </span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDelete(entry.id);
                    }}
                    className="opacity-0 group-hover:opacity-100 p-1 rounded-lg hover:bg-red-500/10 transition-all"
                    title="Delete"
                  >
                    <svg className="w-3.5 h-3.5 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
