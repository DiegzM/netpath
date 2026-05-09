export interface UserSettings {
  name: string;
  email: string;
  avatarUrl: string;
  bio: string;
  authProvider: 'password' | 'google' | 'hybrid';
  aiHintsEnabled: boolean;
  emailNotifications: boolean;
  preferredDifficulty: 'easy' | 'normal' | 'hard';
}
