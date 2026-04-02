'use client';

import React from 'react';
import { TailorResult } from '../lib/types';

function highlightSkills(text: string, skills: string[]) {
  if (!skills || skills.length === 0) return text;
  
  const sortedSkills = [...skills].sort((a, b) => b.length - a.length);
  const regex = new RegExp(`(${sortedSkills.map(s => s.replace(/[-/\\^$*+?.()|[\\]{}]/g, '\\\\$&')).join('|')})`, 'gi');
  
  const parts = text.split(regex);
  return (
    <>
      {parts.map((part, i) => {
        if (sortedSkills.some(s => s.toLowerCase() === part.toLowerCase())) {
          return <span key={i} style={{ color: 'var(--success)', fontWeight: 'bold' }}>{part}</span>;
        }
        return <React.Fragment key={i}>{part}</React.Fragment>;
      })}
    </>
  );
}

interface TailorPanelProps {
  tailorResult: TailorResult | null;
  isLoading: boolean;
  onTailor: () => void;
  missingSkillsCount: number;
  resume: any;
}

export default function TailorPanel({
  tailorResult,
  isLoading,
  onTailor,
  missingSkillsCount,
  resume,
}: TailorPanelProps) {
  // We now always render the TailorPanel so users can optimize their resume even if they have 0 missing skills.

  const exportTextFile = (type: 'txt' | 'doc') => {
    if (!tailorResult) return;
    
    // Instead of randomly stripping experience strings, we can just replace the experience section in the resume text
    const bulletsText = tailorResult.experience_bullets.map(b => `- ${b.tailored}`).join('\n');
    const skillsText = tailorResult.tailored_skills ? `Skills:\n${tailorResult.tailored_skills.join(', ')}\n\n` : '';
    let content = `${tailorResult.professional_summary}\n\n${skillsText}Experience:\n${bulletsText}`;
    
    let mime = 'text/plain';
    
    if (type === 'doc') {
      const contactText = resume?.sections?.contact?.replace(/\n/g, ' | ') || 'Resume';
      
      content = `
<html>
<head>
  <style>
    body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; max-width: 800px; margin: 0 auto; line-height: 1.6; color: #333; }
    h1 { font-size: 24pt; font-weight: bold; margin-bottom: 5px; text-transform: uppercase; color: #111; text-align: center; }
    p.contact { font-size: 10pt; text-align: center; margin-bottom: 20px; color: #555; }
    h3 { font-size: 14pt; border-bottom: 1px solid #000; padding-bottom: 2px; margin-top: 20px; font-weight: bold; color: #222; text-transform: uppercase; }
    p { font-size: 11pt; margin-bottom: 10px; }
    ul { margin-top: 5px; padding-left: 20px; }
    li { font-size: 11pt; margin-bottom: 6px; }
    .bold { font-weight: bold; }
  </style>
</head>
<body>
  <h1>${resume?.sections?.contact?.split('\n')[0] || 'Resume'}</h1>
  <p class="contact">${contactText}</p>
  
  <h3>Professional Summary</h3>
  <p>${tailorResult.professional_summary}</p>
  
  ${tailorResult.tailored_skills && tailorResult.tailored_skills.length > 0 ? `<h3>Skills</h3><p>${tailorResult.tailored_skills.join(', ')}</p>` : ''}

  <h3>Experience</h3>
  <ul>
    ${tailorResult.experience_bullets.map(b => `<li>${b.tailored}</li>`).join('')}
  </ul>

  ${resume?.sections?.education ? `<h3>Education</h3><p>${resume.sections.education.replace(/\n/g, '<br>')}</p>` : ''}
  ${resume?.sections?.certifications ? `<h3>Certifications</h3><p>${resume.sections.certifications.replace(/\n/g, '<br>')}</p>` : ''}
</body>
</html>`;
      mime = 'application/msword';
    }
    
    const blob = new Blob([content], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Tailored_Resume.${type}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

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
          
          <div className="flex justify-end gap-2 mb-4">
             <button onClick={() => exportTextFile('txt')} className="px-3 py-1.5 border rounded text-xs font-semibold hover:opacity-80 transition flex items-center gap-1.5" style={{ background: 'var(--bg-card)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}>
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                Export .txt
             </button>
             <button onClick={() => exportTextFile('doc')} className="px-3 py-1.5 border rounded text-xs font-semibold hover:opacity-80 transition flex items-center gap-1.5" style={{ background: 'var(--bg-card)', borderColor: 'var(--border-color)', color: '#2563eb' }}>
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                Export .doc
             </button>
          </div>
          
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

          {tailorResult.tailored_skills && tailorResult.tailored_skills.length > 0 && (
            <div className="mb-6">
              <h4 className="text-sm font-semibold mb-2 uppercase tracking-wider" style={{ color: 'var(--accent)' }}>
                Optimized Skills Section
              </h4>
              <div className="p-4 rounded-lg flex flex-wrap gap-2" style={{ background: 'var(--bg-secondary)' }}>
                {tailorResult.tailored_skills.map((skill, i) => {
                  const isExisting = resume?.skills_found?.some((s: string) => s.toLowerCase() === skill.toLowerCase());
                  return (
                    <span key={i} className={`chip text-sm ${isExisting ? 'chip-success' : 'chip-danger'}`}>
                      {skill}
                    </span>
                  );
                })}
              </div>
            </div>
          )}

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
                        <p className="font-medium" style={{ color: 'var(--text-primary)' }}>
                          {highlightSkills(bullet.tailored, bullet.injected_skills)}
                        </p>
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
