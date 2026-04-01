'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { getUserProfile } from '../lib/api';

interface User {
  id: number;
  email: string;
  documents: any[];
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (token: string, email: string) => void;
  logout: () => void;
  refreshProfile: () => Promise<void>;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const savedToken = localStorage.getItem('token');
    if (savedToken) {
      setToken(savedToken);
      refreshProfile(savedToken);
    } else {
      setIsLoading(false);
    }
  }, []);

  const refreshProfile = async (currentToken?: string) => {
    try {
      if (currentToken) localStorage.setItem('token', currentToken);
      const profile = await getUserProfile();
      setUser(profile);
    } catch (e) {
      console.error(e);
      logout();
    } finally {
      setIsLoading(false);
    }
  };

  const login = (newToken: string, email: string) => {
    setToken(newToken);
    localStorage.setItem('token', newToken);
    refreshProfile(newToken);
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('token');
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout, refreshProfile, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
