'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '../../components/AuthContext';
import { getDetailedProfile, updateDetailedProfile } from '../../lib/api';

export default function ProfilePage() {
  const { user } = useAuth();
  const [profile, setProfile] = useState({
    resume_text: '',
    experience: '',
    certifications: '',
    skills: '',
    coursework: ''
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!user) return;
    const fetchProfile = async () => {
      try {
        const data = await getDetailedProfile();
        setProfile({
          resume_text: data.resume_text || '',
          experience: data.experience || '',
          certifications: data.certifications || '',
          skills: data.skills || '',
          coursework: data.coursework || ''
        });
      } catch (err) {
        console.error('Failed to load profile', err);
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, [user]);

  const handleChange = (field: keyof typeof profile) => (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setProfile(prev => ({ ...prev, [field]: e.target.value }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage('');
    try {
      await updateDetailedProfile(profile);
      setMessage('Profile saved successfully!');
    } catch (err) {
      setMessage('Failed to save profile. Please try again.');
    } finally {
      setSaving(false);
      setTimeout(() => setMessage(''), 3000);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="glass-card text-center p-8 max-w-md w-full animate-fade-in-up">
          <h2 className="text-xl font-bold mb-4">Access Denied</h2>
          <p className="text-[var(--text-muted)] mb-6">Please log in to view and edit your profile.</p>
          <Link href="/" className="btn-primary">Return Home</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-16">
      <header className="border-b sticky top-0 z-50 backdrop-blur-md" style={{ borderColor: 'var(--nav-border)', background: 'var(--nav-bg)' }}>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14">
            <Link href="/" className="flex items-center gap-2 hover:underline text-sm font-medium" style={{ color: 'var(--accent)' }}>
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back to Analyzer
            </Link>
            <div className="text-sm font-bold" style={{ color: 'var(--text-heading)' }}>
              My Profile
            </div>
            <div className="w-[100px]"></div> {/* Spacer for centering */}
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        <div className="glass-card animate-fade-in-up">
          <div className="mb-6">
            <h1 className="text-2xl font-bold tracking-tight" style={{ color: 'var(--text-heading)' }}>Professional Profile</h1>
            <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
              Save your core professional details below. Keeping this updated creates a strong baseline for future ATS analysis.
            </p>
          </div>

          {loading ? (
             <div className="flex justify-center p-12">
               <div className="w-8 h-8 border-[3px] rounded-full animate-spin" style={{ borderColor: 'var(--border-color)', borderTopColor: 'var(--accent)' }} />
             </div>
          ) : (
            <form onSubmit={handleSave} className="space-y-6">
              <div>
                <label className="section-label">Full Resume Text</label>
                <textarea
                  className="input-field min-h-[160px] resize-y"
                  placeholder="Paste your general, text-only resume here..."
                  value={profile.resume_text}
                  onChange={handleChange('resume_text')}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="section-label">Work Experience</label>
                  <textarea
                    className="input-field min-h-[120px] resize-y"
                    placeholder="E.g., Senior Engineer at TechCorp (2020-Present)..."
                    value={profile.experience}
                    onChange={handleChange('experience')}
                  />
                </div>
                <div>
                  <label className="section-label">Skills Catalog</label>
                  <textarea
                    className="input-field min-h-[120px] resize-y"
                    placeholder="Python, React, Machine Learning, AWS..."
                    value={profile.skills}
                    onChange={handleChange('skills')}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="section-label">Certifications</label>
                  <textarea
                    className="input-field min-h-[120px] resize-y"
                    placeholder="AWS Solutions Architect, PMP..."
                    value={profile.certifications}
                    onChange={handleChange('certifications')}
                  />
                </div>
                <div>
                  <label className="section-label">Coursework / Education</label>
                  <textarea
                    className="input-field min-h-[120px] resize-y"
                    placeholder="B.S. Computer Science, Relevant Coursework: Data Structures..."
                    value={profile.coursework}
                    onChange={handleChange('coursework')}
                  />
                </div>
              </div>

              <div className="pt-4 flex items-center justify-between border-t" style={{ borderColor: 'var(--border-color)' }}>
                <div>
                  {message && (
                    <span className={`text-sm font-medium ${message.includes('success') ? 'text-green-500' : 'text-red-500'} animate-fade-in`}>
                      {message}
                    </span>
                  )}
                </div>
                <button
                  type="submit"
                  disabled={saving}
                  className="btn-primary min-w-[140px]"
                >
                  {saving ? (
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin flex-shrink-0" />
                  ) : (
                    "Save Details"
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </main>
    </div>
  );
}
