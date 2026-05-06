import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { apiRequest } from '../../auth/api';
import { getAccessToken } from '../../auth/storage';
import { useAuth } from '../../auth/AuthContext';
import type { UserSettings } from '../../types/settings';
import styles from './SettingsPage.module.css';

const DEFAULT_SETTINGS: UserSettings = {
  name: '',
  email: '',
  avatarUrl: '',
  bio: '',
  authProvider: 'password',
  aiHintsEnabled: true,
  emailNotifications: true,
  preferredDifficulty: 'normal',
};

export const SettingsPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { updateUser } = useAuth();
  const [settings, setSettings] = useState<UserSettings>(DEFAULT_SETTINGS);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const fromPath = (location.state as { from?: string } | null)?.from;

  useEffect(() => {
    const token = getAccessToken();
    if (!token) {
      setError('Sign in to edit settings.');
      setIsLoading(false);
      return;
    }

    apiRequest<{ settings: UserSettings | null }>('/settings', { token })
      .then((response) => {
        if (response.settings) {
          setSettings(response.settings);
        }
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : 'Unable to load settings.');
      })
      .finally(() => setIsLoading(false));
  }, []);

  async function handleSave(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    setMessage('');

    const token = getAccessToken();
    if (!token) {
      setError('Sign in to save settings.');
      return;
    }

    setIsSaving(true);
    try {
      const response = await apiRequest<{ settings: UserSettings }>('/settings', {
        method: 'PUT',
        token,
        body: settings,
      });
      setSettings(response.settings);
      updateUser({
        name: response.settings.name,
        avatarUrl: response.settings.avatarUrl || null,
        bio: response.settings.bio,
        authProvider: response.settings.authProvider,
      });

      if (fromPath) {
        navigate(fromPath, { replace: true });
      } else {
        navigate('/learn', { replace: true });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to save settings.');
    } finally {
      setIsSaving(false);
    }
  }

  if (isLoading) {
    return <div className={styles.loading}>Loading settings...</div>;
  }

  return (
    <section className={styles.page}>
      <header className={styles.header}>
        <h1 className={styles.title}>Settings</h1>
        <p className={styles.subtitle}>Manage your profile and learning preferences.</p>
      </header>

      <form className={styles.card} onSubmit={handleSave}>
        <label className={styles.field}>
          <span>Username</span>
          <input
            value={settings.name}
            onChange={(event) => setSettings((s) => ({ ...s, name: event.target.value }))}
            placeholder="packet_explorer"
            pattern="[A-Za-z0-9._-]{3,24}"
            title="3-24 chars. Letters, numbers, dot, underscore, or hyphen only."
            minLength={3}
            maxLength={24}
            required
          />
        </label>

        <label className={styles.field}>
          <span>Email</span>
          <input value={settings.email} disabled />
        </label>

        <label className={styles.field}>
          <span>Avatar URL</span>
          <input
            value={settings.avatarUrl}
            onChange={(event) => setSettings((s) => ({ ...s, avatarUrl: event.target.value }))}
            placeholder="https://..."
          />
        </label>

        <label className={styles.field}>
          <span>Bio</span>
          <textarea
            value={settings.bio}
            onChange={(event) => setSettings((s) => ({ ...s, bio: event.target.value }))}
            maxLength={240}
            rows={4}
          />
        </label>

        <label className={styles.inlineField}>
          <input
            type="checkbox"
            checked={settings.aiHintsEnabled}
            onChange={(event) => setSettings((s) => ({ ...s, aiHintsEnabled: event.target.checked }))}
          />
          <span>Enable AI hints</span>
        </label>

        <label className={styles.inlineField}>
          <input
            type="checkbox"
            checked={settings.emailNotifications}
            onChange={(event) => setSettings((s) => ({ ...s, emailNotifications: event.target.checked }))}
          />
          <span>Email notifications</span>
        </label>

        <label className={styles.field}>
          <span>Preferred Difficulty</span>
          <select
            value={settings.preferredDifficulty}
            onChange={(event) => setSettings((s) => ({
              ...s,
              preferredDifficulty: event.target.value as UserSettings['preferredDifficulty'],
            }))}
          >
            <option value="easy">Easy</option>
            <option value="normal">Normal</option>
            <option value="hard">Hard</option>
          </select>
        </label>

        <div className={styles.meta}>Auth provider: {settings.authProvider}</div>

        {error && <div className={styles.error}>{error}</div>}
        {message && <div className={styles.success}>{message}</div>}

        <button className={styles.saveButton} type="submit" disabled={isSaving}>
          {isSaving ? 'Saving...' : 'Save Settings'}
        </button>
      </form>
    </section>
  );
};
