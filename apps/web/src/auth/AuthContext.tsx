import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import {
  getStoredSession,
  loginWithEmail,
  loginWithGoogleCredential,
  logoutSession,
  registerWithEmail,
  setStoredSessionUser,
} from './storage';
import type { AuthUser } from '../types/auth';

interface AuthContextValue {
  user: AuthUser | null;
  isReady: boolean;
  login: (email: string, password: string) => Promise<void>;
  loginWithGoogle: (credential: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (patch: Partial<AuthUser>) => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    getStoredSession()
      .then((sessionUser) => setUser(sessionUser))
      .finally(() => setIsReady(true));
  }, []);

  const value = useMemo<AuthContextValue>(() => ({
    user,
    isReady,
    async login(email, password) {
      const sessionUser = await loginWithEmail(email, password);
      setUser(sessionUser);
    },
    async loginWithGoogle(credential) {
      const sessionUser = await loginWithGoogleCredential(credential);
      setUser(sessionUser);
    },
    async register(name, email, password) {
      const sessionUser = await registerWithEmail(name, email, password);
      setUser(sessionUser);
    },
    async logout() {
      await logoutSession();
      setUser(null);
    },
    updateUser(patch) {
      setUser((previousUser) => {
        if (!previousUser) return previousUser;
        const nextUser = { ...previousUser, ...patch };
        setStoredSessionUser(nextUser);
        return nextUser;
      });
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
