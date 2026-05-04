import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import {
  getStoredSession,
  loginWithEmail,
  logoutSession,
  registerWithEmail,
} from './storage';
import type { AuthUser } from '../types/auth';

interface AuthContextValue {
  user: AuthUser | null;
  isReady: boolean;
  login: (email: string, password: string) => void;
  register: (name: string, email: string, password: string) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    setUser(getStoredSession());
    setIsReady(true);
  }, []);

  const value = useMemo<AuthContextValue>(() => ({
    user,
    isReady,
    login(email, password) {
      setUser(loginWithEmail(email, password));
    },
    register(name, email, password) {
      setUser(registerWithEmail(name, email, password));
    },
    logout() {
      logoutSession();
      setUser(null);
    },
  }), [isReady, user]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) {
    throw new Error('useAuth must be used within an AuthProvider.');
  }
  return value;
}
