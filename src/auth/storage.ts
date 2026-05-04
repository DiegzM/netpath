import type { AuthUser } from '../types/auth';

interface StoredUser extends AuthUser {
  password: string;
}

const USERS_KEY = 'netpath:auth:users';
const SESSION_KEY = 'netpath:auth:session';

function readUsers(): StoredUser[] {
  if (typeof window === 'undefined') return [];

  try {
    const raw = window.localStorage.getItem(USERS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeUsers(users: StoredUser[]) {
  window.localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

function writeSession(user: AuthUser | null) {
  if (user) {
    window.localStorage.setItem(SESSION_KEY, JSON.stringify(user));
  } else {
    window.localStorage.removeItem(SESSION_KEY);
  }
}

export function getStoredSession(): AuthUser | null {
  if (typeof window === 'undefined') return null;

  try {
    const raw = window.localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as AuthUser;
  } catch {
    return null;
  }
}

export function loginWithEmail(email: string, password: string): AuthUser {
  const normalizedEmail = email.trim().toLowerCase();
  const user = readUsers().find(
    (entry) => entry.email.toLowerCase() === normalizedEmail && entry.password === password,
  );

  if (!user) {
    throw new Error('Email or password is incorrect.');
  }

  const sessionUser: AuthUser = {
    id: user.id,
    name: user.name,
    email: user.email,
    createdAt: user.createdAt,
  };

  writeSession(sessionUser);
  return sessionUser;
}

export function registerWithEmail(name: string, email: string, password: string): AuthUser {
  const normalizedEmail = email.trim().toLowerCase();
  const users = readUsers();

  if (users.some((entry) => entry.email.toLowerCase() === normalizedEmail)) {
    throw new Error('An account with that email already exists.');
  }

  const sessionUser: AuthUser = {
    id: `user-${Date.now()}`,
    name: name.trim(),
    email: normalizedEmail,
    createdAt: new Date().toISOString(),
  };

  const storedUser: StoredUser = { ...sessionUser, password };
  writeUsers([...users, storedUser]);
  writeSession(sessionUser);
  return sessionUser;
}

export function logoutSession() {
  if (typeof window === 'undefined') return;
  writeSession(null);
}
