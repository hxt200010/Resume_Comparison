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
  const [isLoginView, setIsLoginView] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please fill in all fields');
      return;
    }
    setError('');
    setIsLoading(true);

    try {
      let data;
      if (isLoginView) {
        data = await loginUser(email, password);
      } else {
        data = await registerUser(email, password);
      }
      login(data.access_token, data.email);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Authentication failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm animate-fade-in">
      <div 
        className="glass-card w-full max-w-sm p-6 relative" 
        onClick={(e) => e.stopPropagation()}
      >
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <h2 className="text-xl font-bold mb-1" style={{ color: 'var(--text-heading)' }}>
          {isLoginView ? 'Welcome Back' : 'Create Account'}
        </h2>
        <p className="text-xs mb-5" style={{ color: 'var(--text-muted)' }}>
          {isLoginView ? 'Sign in to save your history & profile.' : 'Join to save unlimited resumes and ATS histories.'}
        </p>

        {error && (
          <div className="mb-4 p-3 rounded bg-red-500/10 border border-red-500/20 text-red-500 text-xs text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="section-label">Email Address</label>
            <input
              type="email"
              className="input-field"
              placeholder="you@example.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              disabled={isLoading}
            />
          </div>
          <div>
            <label className="section-label">Password</label>
            <input
              type="password"
              className="input-field"
              placeholder="••••••••"
              value={password}
              onChange={e => setPassword(e.target.value)}
              disabled={isLoading}
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="btn-primary w-full justify-center mt-2"
          >
            {isLoading ? (
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : isLoginView ? 'Sign In' : 'Create Account'}
          </button>
        </form>

        <div className="mt-6 text-center text-xs" style={{ color: 'var(--text-muted)' }}>
          {isLoginView ? "Don't have an account? " : "Already have an account? "}
          <button 
            type="button" 
            onClick={() => { setIsLoginView(!isLoginView); setError(''); }}
            className="font-bold hover:underline"
            style={{ color: 'var(--accent)' }}
          >
            {isLoginView ? 'Sign Up' : 'Log In'}
          </button>
        </div>
      </div>
    </div>
  );
}
