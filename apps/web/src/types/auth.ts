export interface AuthUser {
  id: string;
  name: string;
  email: string;
  createdAt: string;
  avatarUrl?: string | null;
  bio?: string;
  authProvider?: 'password' | 'google' | 'hybrid';
}
