import React, { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../auth/AuthContext';
import styles from './AuthPage.module.css';

type AuthMode = 'login' | 'register';

interface LocationState {
  from?: {
    pathname?: string;
  };
}

export const AuthPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, register, user } = useAuth();
  const [mode, setMode] = useState<AuthMode>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const nextPath = useMemo(() => {
    const state = location.state as LocationState | null;
    return state?.from?.pathname ?? '/learn';
  }, [location.state]);

  useEffect(() => {
    if (user) {
      navigate(nextPath, { replace: true });
    }
  }, [navigate, nextPath, user]);

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');

    try {
      if (mode === 'login') {
        login(email, password);
      } else {
        register(name, email, password);
      }

      navigate(nextPath, { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to sign in right now.');
    }
  }

  return (
    <div className={styles.page}>
      <div className={styles.grid} aria-hidden />
      <div className={styles.glow} aria-hidden />
      <button type="button" className={styles.backBtn} onClick={() => navigate(-1)}>
        Back
      </button>

      <motion.section
        className={styles.card}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
      >
        <div className={styles.eyebrow}>NetPath Access</div>
        <h1 className={styles.title}>{mode === 'login' ? 'Sign in to keep learning' : 'Create your account'}</h1>
        <p className={styles.subtitle}>
          Save your stage progress and pick up where you left off.
        </p>

        <div className={styles.toggle}>
          <button
            type="button"
            className={`${styles.toggleBtn} ${mode === 'login' ? styles.active : ''}`}
            onClick={() => setMode('login')}
          >
            Sign In
          </button>
          <button
            type="button"
            className={`${styles.toggleBtn} ${mode === 'register' ? styles.active : ''}`}
            onClick={() => setMode('register')}
          >
            Register
          </button>
        </div>

        <form className={styles.form} onSubmit={handleSubmit}>
          {mode === 'register' && (
            <label className={styles.field}>
              <span>Name</span>
              <input
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="Packet Explorer"
                required
              />
            </label>
          )}

          <label className={styles.field}>
            <span>Email</span>
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="you@example.com"
              required
            />
          </label>

          <label className={styles.field}>
            <span>Password</span>
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Minimum 6 characters"
              minLength={6}
              required
            />
          </label>

          {error && <div className={styles.error}>{error}</div>}

          <button className={styles.submit} type="submit">
            {mode === 'login' ? 'Sign In' : 'Create Account'}
          </button>
        </form>

        <p className={styles.note}>
          This first pass stores accounts locally in your browser so you can keep building while the backend is still pending.
        </p>
      </motion.section>
    </div>
  );
};
