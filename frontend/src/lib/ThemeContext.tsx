'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

export type ThemeName = 'light' | 'soft-dark' | 'warm' | 'ocean';

interface ThemeInfo {
  name: ThemeName;
  label: string;
  description: string;
  preview: { bg: string; card: string; accent: string };
}

export const THEMES: ThemeInfo[] = [
  {
    name: 'light',
    label: 'Clean Light',
    description: 'Crisp and professional',
    preview: { bg: '#f8f9fb', card: '#ffffff', accent: '#4f6ef7' },
  },
  {
    name: 'soft-dark',
    label: 'Soft Dark',
    description: 'Easy on the eyes',
    preview: { bg: '#1a1d27', card: '#22262f', accent: '#8b9cf7' },
  },
  {
    name: 'warm',
    label: 'Warm Neutral',
    description: 'Calm and inviting',
    preview: { bg: '#faf8f5', card: '#ffffff', accent: '#9b7b5e' },
  },
  {
    name: 'ocean',
    label: 'Ocean Calm',
    description: 'Cool and focused',
    preview: { bg: '#f4f7f9', card: '#ffffff', accent: '#3a8f9f' },
  },
];

interface ThemeContextValue {
  theme: ThemeName;
  setTheme: (t: ThemeName) => void;
  themes: ThemeInfo[];
}

const ThemeContext = createContext<ThemeContextValue>({
  theme: 'light',
  setTheme: () => {},
  themes: THEMES,
});

export function useTheme() {
  return useContext(ThemeContext);
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<ThemeName>('light');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('ats-theme') as ThemeName | null;
    if (saved && THEMES.some((t) => t.name === saved)) {
      setThemeState(saved);
    }
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted) {
      document.documentElement.setAttribute('data-theme', theme);
      localStorage.setItem('ats-theme', theme);
    }
  }, [theme, mounted]);

  const setTheme = useCallback((t: ThemeName) => {
    setThemeState(t);
  }, []);

  // Prevent flash of wrong theme
  if (!mounted) {
    return <div style={{ visibility: 'hidden' }}>{children}</div>;
  }

  return (
    <ThemeContext.Provider value={{ theme, setTheme, themes: THEMES }}>
      {children}
    </ThemeContext.Provider>
  );
}
