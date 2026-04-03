'use client';

import React, { useState } from 'react';
import { JobDescriptionInput, TailorCoverLetterResult } from '../lib/types';
import { tailorCoverLetter, parseResume } from '../lib/api';
import { useAuth } from './AuthContext';

interface CoverLetterTailorProps {
  job: JobDescriptionInput;
  resume?: import('../lib/types').ParsedResume;
}

export default function CoverLetterTailor({ job, resume }: CoverLetterTailorProps) {
  const { user } = useAuth();
  
  const [baseCoverLetter, setBaseCoverLetter] = useState<string>('');
  const [customInstructions, setCustomInstructions] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [result, setResult] = useState<TailorCoverLetterResult | null>(null);

  // Get cover letters from DB if logged in
  const savedCoverLetters = user?.documents?.filter(d => d.doc_type === 'cover_letter') || [];

  const handleSelectPreSaved = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const docId = parseInt(e.target.value);
    const doc = savedCoverLetters.find(d => d.id === docId);
    if (doc) {
      setBaseCoverLetter(doc.content);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const parsed = await parseResume(file);
      if (parsed?.raw_text) {
        setBaseCoverLetter(parsed.raw_text);
      } else {
        alert("Could not extract text from the file.");
      }
    } catch (err: any) {
      alert(err.message || "Failed to upload and parse file.");
    } finally {
      setIsUploading(false);
      e.target.value = '';
    }
  };

  const handleGenerate = async () => {
    if (!baseCoverLetter) {
      alert("Please provide a base cover letter to tailor.");
      return;
    }
    
    setIsGenerating(true);
    try {
      const res = await tailorCoverLetter(baseCoverLetter, job, resume, customInstructions);
      setResult(res);
    } catch (e) {
      alert("Failed to tailor cover letter. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  const exportTextFile = (type: 'txt' | 'doc') => {
    if (!result) return;
    
    let content = result.revised_cover_letter;
    let mime = 'text/plain';
    
    if (type === 'doc') {
      content = `
<html>
<head>
  <style>
    body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; max-width: 800px; margin: 0 auto; line-height: 1.6; color: #333; }
    p { font-size: 11pt; margin-bottom: 15px; }
  </style>
</head>
<body>
  ${result.revised_cover_letter.split('\\n').map(l => l.trim() === '' ? '<br>' : `<p>${l}</p>`).join('')}
</body>
</html>`;
      mime = 'application/msword';
    }
    
    const blob = new Blob([content], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Tailored_CoverLetter.${type}`;
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
              ✉️ Cover Letter Tailor
            </h3>
            <span className="chip chip-info text-[10px] py-0 uppercase tracking-wider font-bold">AI Powered</span>
          </div>
          <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
            Rewrite your cover letter to perfectly match this job description, preserving your unique human voice.
          </p>
        </div>

        <button
          onClick={handleGenerate}
          disabled={isGenerating || !baseCoverLetter}
          className="btn-primary flex-shrink-0"
        >
          {isGenerating ? (
            <>
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Writing...
            </>
          ) : (
            <>
              Generate Cover Letter
            </>
          )}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6 pt-6 border-t" style={{ borderColor: 'var(--border-color)' }}>
        
        {/* Left Side: Input Area */}
        <div className="flex flex-col gap-4">
          {savedCoverLetters.length > 0 && (
            <div>
              <label className="section-label">Select Saved Cover Letter</label>
              <select 
                className="input-field w-full text-sm" 
                onChange={handleSelectPreSaved}
                defaultValue=""
              >
                <option value="" disabled>-- Select a document --</option>
                {savedCoverLetters.map(doc => (
                 <option key={doc.id} value={doc.id}>{doc.name}</option>
                ))}
              </select>
            </div>
          )}

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="section-label mb-0" style={{ marginBottom: 0 }}>Or Paste Base Cover Letter</label>
              <div>
                <input
                  type="file"
                  id="coverLetterUpload"
                  className="hidden"
                  accept=".pdf,.docx,.txt"
                  onChange={handleFileUpload}
                  disabled={isUploading}
                />
                <button 
                  onClick={() => document.getElementById('coverLetterUpload')?.click()}
                  disabled={isUploading}
                  className="px-3 py-1.5 border rounded text-xs font-semibold hover:opacity-80 transition flex items-center gap-1.5"
                  style={{ background: 'var(--bg-card)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
                >
                  {isUploading ? 'Uploading...' : '📁 Upload File'}
                </button>
              </div>
            </div>
            <textarea
              className="input-field min-h-[300px] resize-y text-sm w-full"
              placeholder="Dear Hiring Manager..."
              value={baseCoverLetter}
              onChange={(e) => setBaseCoverLetter(e.target.value)}
            />
          </div>
          
          <div className="mt-2">
            <label className="section-label mb-2">Additional Requests (Optional)</label>
            <textarea
              className="input-field min-h-[100px] resize-y text-sm w-full"
              placeholder="E.g. Focus on my leadership skills, keep it under 3 paragraphs, use a more enthusiastic tone..."
              value={customInstructions}
              onChange={(e) => setCustomInstructions(e.target.value)}
            />
          </div>
        </div>

        {/* Right Side: Output Area */}
        <div className="border border-dashed rounded-lg p-5 flex flex-col items-center justify-center min-h-[300px]" style={{ borderColor: 'var(--border-color)', background: 'var(--bg-secondary)' }}>
          {!result && !isGenerating && (
            <div className="text-center opacity-60">
              <span className="text-4xl mb-3 block">📄</span>
              <p className="text-sm">Provide your base cover letter and click generate to see the tailored result here.</p>
            </div>
          )}
          
          {isGenerating && (
             <div className="flex flex-col items-center justify-center p-8">
               <div className="w-10 h-10 border-[3px] rounded-full animate-spin mb-4" style={{ borderColor: 'var(--border-color)', borderTopColor: 'var(--accent)' }} />
               <p className="text-sm font-medium animate-pulse" style={{ color: 'var(--text-primary)' }}>Hang tight... I'm writing your cover letter</p>
             </div>
          )}

          {result && !isGenerating && (
            <div className="w-full animate-fade-in text-left">
              <div className="flex justify-end gap-2 mb-4">
                 <button onClick={() => exportTextFile('txt')} className="px-3 py-1.5 border rounded text-xs font-semibold hover:opacity-80 transition flex items-center gap-1.5" style={{ background: 'var(--bg-card)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}>
                    Export .txt
                 </button>
                 <button onClick={() => exportTextFile('doc')} className="px-3 py-1.5 border rounded text-xs font-semibold hover:opacity-80 transition flex items-center gap-1.5" style={{ background: 'var(--bg-card)', borderColor: 'var(--border-color)', color: '#2563eb' }}>
                    Export .doc
                 </button>
              </div>
              
              <div className="p-4 rounded-lg bg-[var(--bg-card)] border border-[var(--border-color)] overflow-y-auto max-h-[400px]">
                <p className="whitespace-pre-wrap text-sm leading-relaxed" style={{ color: 'var(--text-primary)' }}>
                  {result.revised_cover_letter}
                </p>
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
