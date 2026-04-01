'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useTheme, THEMES, ThemeName } from '../lib/ThemeContext';

export default function ThemeSelector() {
  const { theme, setTheme } = useTheme();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const current = THEMES.find((t) => t.name === theme) || THEMES[0];

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className="theme-toggle-btn"
        title="Change theme"
        id="theme-toggle"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
            d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01"
          />
        </svg>
        <span className="hidden sm:inline text-sm">Theme</span>
      </button>

      {open && (
        <div className="theme-dropdown animate-fade-in">
          <p className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-3 px-1">
            Choose a theme
          </p>
          <div className="space-y-1.5">
            {THEMES.map((t) => (
              <button
                key={t.name}
                onClick={() => { setTheme(t.name as ThemeName); setOpen(false); }}
                className={`theme-option ${theme === t.name ? 'theme-option-active' : ''}`}
                id={`theme-${t.name}`}
              >
                {/* Color preview dots */}
                <div className="flex gap-1 flex-shrink-0">
                  <span className="w-3.5 h-3.5 rounded-full border border-black/10" style={{ background: t.preview.bg }} />
                  <span className="w-3.5 h-3.5 rounded-full border border-black/10" style={{ background: t.preview.card }} />
                  <span className="w-3.5 h-3.5 rounded-full border border-black/10" style={{ background: t.preview.accent }} />
                </div>
                <div className="text-left flex-1 min-w-0">
                  <p className="text-sm font-medium text-[var(--text-primary)] leading-tight">{t.label}</p>
                  <p className="text-[11px] text-[var(--text-muted)] leading-tight mt-0.5">{t.description}</p>
                </div>
                {theme === t.name && (
                  <svg className="w-4 h-4 text-[var(--accent)] flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
