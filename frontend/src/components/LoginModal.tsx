'use client';

import React, { useState } from 'react';
import { loginUser, registerUser } from '../lib/api';
import { useAuth } from './AuthContext';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function LoginModal({ isOpen, onClose }: LoginModalProps) {
  const { login } = useAuth();

  // View state: 'login' | 'signup-step1' | 'signup-step2'
  const [view, setView] = useState<'login' | 'signup-step1' | 'signup-step2'>('login');

  // Form values
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [noPromoEmails, setNoPromoEmails] = useState(false);

  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen) return null;

  const resetForm = () => {
    setFirstName('');
    setLastName('');
    setEmail('');
    setPassword('');
    setConfirmPassword('');
    setShowPassword(false);
    setNoPromoEmails(false);
    setError('');
    setView('login');
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  // ── LOGIN submit ────────────────────────────────
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) { setError('Please fill in all fields'); return; }
    setError('');
    setIsLoading(true);
    try {
      const data = await loginUser(email, password);
      login(data.access_token, data.email);
      handleClose();
    } catch (err: any) {
      setError(err.message || 'Invalid credentials');
    } finally {
      setIsLoading(false);
    }
  };

  // ── SIGNUP Step 1 → 2 ──────────────────────────
  const handleStep1Next = (e: React.FormEvent) => {
    e.preventDefault();
    if (!firstName.trim()) { setError('Please enter your first name'); return; }
    setError('');
    setView('signup-step2');
  };

  // ── SIGNUP Step 2 submit ───────────────────────
  const handleSignupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password || !confirmPassword) { setError('Please fill in all fields'); return; }
    if (password !== confirmPassword) { setError('Passwords do not match'); return; }
    if (password.length < 6) { setError('Password must be at least 6 characters'); return; }
    setError('');
    setIsLoading(true);
    try {
      const data = await registerUser(email, password);
      login(data.access_token, data.email);
      handleClose();
    } catch (err: any) {
      setError(err.message || 'Registration failed');
    } finally {
      setIsLoading(false);
    }
  };

  // ═══════════════════════════════════════════════════
  //  RENDER
  // ═══════════════════════════════════════════════════
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      onClick={handleClose}
      style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(6px)' }}
    >
      {/* Abstract gradient background blobs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden>
        <div
          style={{
            position: 'absolute', top: '-20%', left: '-10%',
            width: '60%', height: '70%', borderRadius: '50%',
            background: 'linear-gradient(135deg, #6c63ff 0%, #00d2ff 100%)',
            opacity: 0.18, filter: 'blur(80px)',
          }}
        />
        <div
          style={{
            position: 'absolute', bottom: '-15%', right: '-8%',
            width: '55%', height: '65%', borderRadius: '50%',
            background: 'linear-gradient(135deg, #ff6b6b 0%, #ffa502 50%, #a855f7 100%)',
            opacity: 0.16, filter: 'blur(80px)',
          }}
        />
      </div>

      {/* Modal Card */}
      <div
        className="relative w-full max-w-md mx-4 animate-scale-in"
        onClick={(e) => e.stopPropagation()}
        style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border-color)',
          borderRadius: '1.25rem',
          boxShadow: '0 25px 60px rgba(0,0,0,0.3)',
          overflow: 'hidden',
        }}
      >
        {/* Top decorative bar */}
        <div style={{
          height: '4px',
          background: view === 'login'
            ? 'var(--accent)'
            : view === 'signup-step1'
            ? 'linear-gradient(90deg, var(--accent) 50%, var(--border-color) 50%)'
            : 'var(--accent)',
          transition: 'background 0.4s ease',
        }} />

        {/* Close button */}
        <button
          onClick={handleClose}
          style={{
            position: 'absolute', top: '1rem', right: '1rem',
            color: 'var(--text-muted)', background: 'none', border: 'none',
            cursor: 'pointer', padding: '0.25rem', zIndex: 10,
            display: 'flex', borderRadius: '0.375rem',
            transition: 'color 0.2s, background 0.2s',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = 'var(--text-primary)';
            e.currentTarget.style.background = 'var(--bg-secondary)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = 'var(--text-muted)';
            e.currentTarget.style.background = 'none';
          }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <div style={{ padding: '2rem 2rem 1.75rem' }}>

          {/* ═══════════ LOGIN VIEW ═══════════ */}
          {view === 'login' && (
            <div className="animate-fade-in" key="login">
              <h2 style={{
                fontSize: '1.625rem', fontWeight: 800,
                color: 'var(--text-heading)', marginBottom: '0.25rem',
                letterSpacing: '-0.02em',
              }}>
                Welcome back
              </h2>
              <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
                Sign in to access your profile and ATS history.
              </p>

              {error && (
                <div style={{
                  background: 'var(--danger-bg)', border: '1px solid var(--danger-border)',
                  color: 'var(--danger)', borderRadius: '0.5rem',
                  padding: '0.625rem 0.875rem', fontSize: '0.8125rem',
                  marginBottom: '1rem', textAlign: 'center',
                }}>
                  {error}
                </div>
              )}

              <form onSubmit={handleLoginSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div>
                  <label className="section-label">Email address</label>
                  <input
                    type="email" className="input-field" placeholder="you@example.com"
                    value={email} onChange={(e) => setEmail(e.target.value)} disabled={isLoading}
                    autoFocus
                  />
                </div>
                <div>
                  <label className="section-label">Password</label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      className="input-field" placeholder="••••••••"
                      value={password} onChange={(e) => setPassword(e.target.value)} disabled={isLoading}
                      style={{ paddingRight: '2.75rem' }}
                    />
                    <button
                      type="button" tabIndex={-1}
                      onClick={() => setShowPassword(!showPassword)}
                      style={{
                        position: 'absolute', right: '0.625rem', top: '50%', transform: 'translateY(-50%)',
                        background: 'none', border: 'none', cursor: 'pointer',
                        color: 'var(--text-muted)', padding: '0.25rem',
                      }}
                    >
                      {showPassword ? (
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}><path d="M3.98 8.223A10.477 10.477 0 001.934 12c1.292 4.338 5.31 7.5 10.066 7.5.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" strokeLinecap="round" strokeLinejoin="round"/></svg>
                      ) : (
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}><path d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" strokeLinecap="round" strokeLinejoin="round"/><path d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" strokeLinecap="round" strokeLinejoin="round"/></svg>
                      )}
                    </button>
                  </div>
                </div>

                <div style={{ textAlign: 'right', marginTop: '-0.5rem' }}>
                  <button
                    type="button"
                    onClick={() => alert('Please contact support for password recovery. Email services are disabled for this local demo.')}
                    style={{
                      background: 'none', border: 'none', cursor: 'pointer',
                      color: 'var(--accent)', fontSize: '0.75rem', fontWeight: 600,
                      fontFamily: 'inherit',
                    }}
                  >
                    Forgot password?
                  </button>
                </div>

                <button type="submit" disabled={isLoading} className="btn-primary" style={{
                  width: '100%', justifyContent: 'center', padding: '0.75rem',
                  fontSize: '0.9375rem', borderRadius: '0.75rem', marginTop: '0.25rem',
                }}>
                  {isLoading ? (
                    <div style={{ width: 18, height: 18, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: 'white', borderRadius: '50%' }} className="animate-spin" />
                  ) : 'Sign in'}
                </button>
              </form>

              <div style={{
                marginTop: '1.5rem', textAlign: 'center',
                fontSize: '0.8125rem', color: 'var(--text-muted)',
              }}>
                Don&apos;t have an account?{' '}
                <button
                  type="button"
                  onClick={() => { setView('signup-step1'); setError(''); }}
                  style={{
                    background: 'none', border: 'none', cursor: 'pointer',
                    color: 'var(--accent)', fontWeight: 700, fontFamily: 'inherit',
                    fontSize: '0.8125rem', textDecoration: 'underline',
                    textUnderlineOffset: '2px',
                  }}
                >
                  Sign up
                </button>
              </div>
            </div>
          )}

          {/* ═══════════ SIGNUP STEP 1: Name ═══════════ */}
          {view === 'signup-step1' && (
            <div className="animate-slide-right" key="step1">
              {/* Step indicator */}
              <div style={{
                display: 'flex', gap: '0.375rem', marginBottom: '1.75rem',
              }}>
                <div style={{ flex: 1, height: 3, borderRadius: 2, background: 'var(--accent)' }} />
                <div style={{ flex: 1, height: 3, borderRadius: 2, background: 'var(--border-color)' }} />
              </div>

              <h2 style={{
                fontSize: '1.625rem', fontWeight: 800,
                color: 'var(--text-heading)', marginBottom: '0.25rem',
                letterSpacing: '-0.02em',
              }}>
                What&apos;s your name?
              </h2>
              <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
                Let&apos;s start with the basics — we&apos;ll use this to personalize your experience.
              </p>

              {error && (
                <div style={{
                  background: 'var(--danger-bg)', border: '1px solid var(--danger-border)',
                  color: 'var(--danger)', borderRadius: '0.5rem',
                  padding: '0.625rem 0.875rem', fontSize: '0.8125rem',
                  marginBottom: '1rem', textAlign: 'center',
                }}>
                  {error}
                </div>
              )}

              <form onSubmit={handleStep1Next} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div>
                  <label className="section-label">First name</label>
                  <input
                    type="text" className="input-field" placeholder="John"
                    value={firstName} onChange={(e) => setFirstName(e.target.value)}
                    autoFocus
                  />
                </div>
                <div>
                  <label className="section-label">Last name <span style={{ color: 'var(--text-muted)', fontWeight: 400, textTransform: 'none' }}>(optional)</span></label>
                  <input
                    type="text" className="input-field" placeholder="Smith"
                    value={lastName} onChange={(e) => setLastName(e.target.value)}
                  />
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
                  <button type="submit" className="btn-primary" style={{
                    padding: '0.75rem 1.75rem', borderRadius: '50rem',
                    fontSize: '0.875rem', gap: '0.5rem',
                  }}>
                    Continue
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                </div>
              </form>

              <div style={{
                marginTop: '1.5rem', textAlign: 'center',
                fontSize: '0.8125rem', color: 'var(--text-muted)',
              }}>
                Already have an account?{' '}
                <button
                  type="button"
                  onClick={() => { setView('login'); setError(''); }}
                  style={{
                    background: 'none', border: 'none', cursor: 'pointer',
                    color: 'var(--accent)', fontWeight: 700, fontFamily: 'inherit',
                    fontSize: '0.8125rem', textDecoration: 'underline',
                    textUnderlineOffset: '2px',
                  }}
                >
                  Sign in
                </button>
              </div>
            </div>
          )}

          {/* ═══════════ SIGNUP STEP 2: Email & Password ═══════════ */}
          {view === 'signup-step2' && (
            <div className="animate-slide-right" key="step2">
              {/* Step indicator */}
              <div style={{
                display: 'flex', gap: '0.375rem', marginBottom: '1.75rem',
              }}>
                <div style={{ flex: 1, height: 3, borderRadius: 2, background: 'var(--accent)' }} />
                <div style={{ flex: 1, height: 3, borderRadius: 2, background: 'var(--accent)' }} />
              </div>

              <h2 style={{
                fontSize: '1.625rem', fontWeight: 800,
                color: 'var(--text-heading)', marginBottom: '0.25rem',
                letterSpacing: '-0.02em',
              }}>
                And, your details?
              </h2>
              <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
                Create an account or{' '}
                <button
                  type="button"
                  onClick={() => { setView('login'); setError(''); }}
                  style={{
                    background: 'none', border: 'none', cursor: 'pointer',
                    color: 'var(--accent)', fontWeight: 600, fontFamily: 'inherit',
                    fontSize: '0.8125rem', textDecoration: 'underline',
                    textUnderlineOffset: '2px', padding: 0,
                  }}
                >
                  Sign in
                </button>
              </p>

              {error && (
                <div style={{
                  background: 'var(--danger-bg)', border: '1px solid var(--danger-border)',
                  color: 'var(--danger)', borderRadius: '0.5rem',
                  padding: '0.625rem 0.875rem', fontSize: '0.8125rem',
                  marginBottom: '1rem', textAlign: 'center',
                }}>
                  {error}
                </div>
              )}

              <form onSubmit={handleSignupSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div>
                  <label className="section-label">Email address</label>
                  <input
                    type="email" className="input-field" placeholder="you@example.com"
                    value={email} onChange={(e) => setEmail(e.target.value)} disabled={isLoading}
                    autoFocus
                  />
                </div>
                <div>
                  <label className="section-label">Password</label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      className="input-field" placeholder="Min. 6 characters"
                      value={password} onChange={(e) => setPassword(e.target.value)} disabled={isLoading}
                      style={{ paddingRight: '2.75rem' }}
                    />
                    <button
                      type="button" tabIndex={-1}
                      onClick={() => setShowPassword(!showPassword)}
                      style={{
                        position: 'absolute', right: '0.625rem', top: '50%', transform: 'translateY(-50%)',
                        background: 'none', border: 'none', cursor: 'pointer',
                        color: 'var(--text-muted)', padding: '0.25rem',
                      }}
                    >
                      {showPassword ? (
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}><path d="M3.98 8.223A10.477 10.477 0 001.934 12c1.292 4.338 5.31 7.5 10.066 7.5.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" strokeLinecap="round" strokeLinejoin="round"/></svg>
                      ) : (
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}><path d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" strokeLinecap="round" strokeLinejoin="round"/><path d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" strokeLinecap="round" strokeLinejoin="round"/></svg>
                      )}
                    </button>
                  </div>
                  {/* Password strength hints */}
                  <div style={{ display: 'flex', gap: '0.375rem', marginTop: '0.5rem' }}>
                    {[1, 2, 3, 4].map((i) => (
                      <div key={i} style={{
                        flex: 1, height: 3, borderRadius: 2,
                        background: password.length >= i * 3
                          ? password.length >= 10 ? 'var(--success)' : 'var(--warning)'
                          : 'var(--border-color)',
                        transition: 'background 0.3s ease',
                      }} />
                    ))}
                  </div>

                  <div style={{ marginTop: '0.5rem' }}>
                    <label className="section-label">Confirm Password</label>
                    <input
                      type="password" className="input-field" placeholder="Re-type password"
                      value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} disabled={isLoading}
                    />
                  </div>
                  <p style={{ fontSize: '0.6875rem', color: 'var(--text-muted)', marginTop: '0.375rem' }}>
                    Use 6+ characters with a mix of letters, numbers & symbols
                  </p>
                </div>

                {/* Promotional checkbox */}
                <label style={{
                  display: 'flex', alignItems: 'flex-start', gap: '0.625rem',
                  cursor: 'pointer', fontSize: '0.75rem', color: 'var(--text-secondary)',
                  lineHeight: 1.45,
                }}>
                  <input
                    type="checkbox"
                    checked={noPromoEmails}
                    onChange={(e) => setNoPromoEmails(e.target.checked)}
                    style={{
                      marginTop: '0.1rem', accentColor: 'var(--accent)',
                      width: 15, height: 15, flexShrink: 0,
                    }}
                  />
                  I do not want to receive emails with advertising, news, suggestions or marketing promotions
                </label>

                <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.25rem' }}>
                  <button
                    type="button"
                    onClick={() => { setView('signup-step1'); setError(''); }}
                    className="btn-secondary"
                    style={{ padding: '0.75rem 1.25rem', borderRadius: '0.75rem', flex: '0 0 auto' }}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                    </svg>
                    Back
                  </button>
                  <button type="submit" disabled={isLoading} className="btn-primary" style={{
                    flex: 1, justifyContent: 'center', padding: '0.75rem',
                    fontSize: '0.9375rem', borderRadius: '0.75rem',
                  }}>
                    {isLoading ? (
                      <div style={{ width: 18, height: 18, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: 'white', borderRadius: '50%' }} className="animate-spin" />
                    ) : 'Sign up'}
                  </button>
                </div>
              </form>

              <p style={{
                marginTop: '1.25rem', textAlign: 'center',
                fontSize: '0.6875rem', color: 'var(--text-muted)', lineHeight: 1.5,
              }}>
                By signing up to create an account, you are accepting our terms of service and privacy policy.
              </p>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
