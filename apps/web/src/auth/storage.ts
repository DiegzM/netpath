import type { AuthUser } from '../types/auth';
import { apiRequest } from './api';

const SESSION_KEY = 'netpath:auth:session';
const TOKEN_KEY = 'netpath:auth:accessToken';
const LEGACY_USERS_KEY = 'netpath:auth:users';

interface AuthResponse {
  user: AuthUser;
  accessToken: string;
}

function clearLegacyUsersKey() {
  if (typeof window === 'undefined') return;
  window.localStorage.removeItem(LEGACY_USERS_KEY);
}

function writeSession(user: AuthUser | null, token: string | null) {
  if (user) {
    window.localStorage.setItem(SESSION_KEY, JSON.stringify(user));
  } else {
    window.localStorage.removeItem(SESSION_KEY);
  }

  if (token) {
    window.localStorage.setItem(TOKEN_KEY, token);
  } else {
    window.localStorage.removeItem(TOKEN_KEY);
  }
}

function getStoredToken() {
  if (typeof window === 'undefined') return null;
  return window.localStorage.getItem(TOKEN_KEY);
}

export async function getStoredSession(): Promise<AuthUser | null> {
  if (typeof window === 'undefined') return null;

  clearLegacyUsersKey();

  const token = getStoredToken();
  if (!token) {
    return null;
  }

  try {
    const response = await apiRequest<{ user: AuthUser | null }>('/me', { token });
    if (!response.user) {
      writeSession(null, null);
      return null;
    }

    writeSession(response.user, token);
    return response.user;
  } catch {
    writeSession(null, null);
    return null;
  }
}

export async function loginWithEmail(email: string, password: string): Promise<AuthUser> {
  const response = await apiRequest<AuthResponse>('/auth/login', {
    method: 'POST',
    body: { email, password },
  });

  writeSession(response.user, response.accessToken);
  clearLegacyUsersKey();
  return response.user;
}

export async function registerWithEmail(name: string, email: string, password: string): Promise<AuthUser> {
  const response = await apiRequest<AuthResponse>('/auth/register', {
    method: 'POST',
    body: { name, email, password },
  });

  writeSession(response.user, response.accessToken);
  clearLegacyUsersKey();
  return response.user;
}

export async function loginWithGoogleCredential(credential: string): Promise<AuthUser> {
  const response = await apiRequest<AuthResponse>('/auth/google', {
    method: 'POST',
    body: { credential },
  });

  writeSession(response.user, response.accessToken);
  clearLegacyUsersKey();
  return response.user;
}

export async function logoutSession() {
  if (typeof window === 'undefined') return;
  const token = getStoredToken();

  try {
    if (token) {
      await apiRequest('/auth/logout', {
        method: 'POST',
        token,
      });
    }
  } catch {
    // Ignore logout network errors and always clear local session.
  }

  writeSession(null, null);
}

export function getAccessToken(): string | null {
  return getStoredToken();
}

export function setStoredSessionUser(user: AuthUser | null) {
  if (typeof window === 'undefined') return;
  writeSession(user, getStoredToken());
}
