import React, { useEffect, useMemo, useRef, useState } from 'react';
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
  const { login, loginWithGoogle, register, user } = useAuth();
  const [mode, setMode] = useState<AuthMode>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGoogleReady, setIsGoogleReady] = useState(false);
  const googleButtonRef = useRef<HTMLDivElement | null>(null);
  const rawGoogleClientId = (import.meta.env.VITE_GOOGLE_CLIENT_ID || '').trim();
  const googleClientId = rawGoogleClientId.startsWith('replace_') ? '' : rawGoogleClientId;

  const nextPath = useMemo(() => {
    const state = location.state as LocationState | null;
    return state?.from?.pathname ?? '/learn';
  }, [location.state]);

  useEffect(() => {
    if (user) {
      navigate(nextPath, { replace: true });
    }
  }, [navigate, nextPath, user]);

  useEffect(() => {
    if (!googleClientId || !googleButtonRef.current) return;

    let isCancelled = false;
    const scriptId = 'google-identity-script';

    const initializeGoogleButton = () => {
      if (isCancelled || !window.google || !googleButtonRef.current) return;

      try {
        window.google.accounts.id.initialize({
          client_id: googleClientId,
          callback: async ({ credential }) => {
            if (!credential) {
              setError('Google sign-in did not return a credential.');
              return;
            }

            setError('');
            setIsSubmitting(true);
            try {
              await loginWithGoogle(credential);
              navigate(nextPath, { replace: true });
            } catch (err) {
              setError(err instanceof Error ? err.message : 'Google sign-in failed.');
            } finally {
              setIsSubmitting(false);
            }
          },
        });

        googleButtonRef.current.innerHTML = '';
        window.google.accounts.id.renderButton(googleButtonRef.current, {
          theme: 'outline',
          size: 'large',
          width: 360,
          text: 'continue_with',
        });

        setIsGoogleReady(true);
      } catch {
        setIsGoogleReady(false);
        setError('Google sign-in could not be initialized. Check VITE_GOOGLE_CLIENT_ID.');
      }
    };

    const waitForGoogleAndInit = (attempt = 0) => {
      if (isCancelled) return;

      if (window.google) {
        initializeGoogleButton();
        return;
      }

      if (attempt >= 50) {
        setIsGoogleReady(false);
        setError('Google sign-in could not be loaded. Check network or browser blockers.');
        return;
      }

      window.setTimeout(() => waitForGoogleAndInit(attempt + 1), 100);
    };

    const existingScript = document.getElementById(scriptId) as HTMLScriptElement | null;
    if (existingScript) {
      waitForGoogleAndInit();
      return;
    }

    const script = document.createElement('script');
    script.id = scriptId;
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.onload = () => waitForGoogleAndInit();
    script.onerror = () => setError('Could not load Google sign-in.');
    document.head.appendChild(script);

    return () => {
      isCancelled = true;
    };
  }, [googleClientId, loginWithGoogle, navigate, nextPath]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      if (mode === 'login') {
        await login(email, password);
      } else {
        await register(name, email, password);
      }

      navigate(nextPath, { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to sign in right now.');
    } finally {
      setIsSubmitting(false);
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
              <span>Username</span>
              <input
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="netpath_builder"
                pattern="[A-Za-z0-9._-]{3,24}"
                title="3-24 chars. Letters, numbers, dot, underscore, or hyphen only."
                minLength={3}
                maxLength={24}
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
            {isSubmitting ? 'Please wait...' : mode === 'login' ? 'Sign In' : 'Create Account'}
          </button>
        </form>

        <div className={styles.divider}>or</div>
        <div className={styles.googleWrap}>
          <div className={styles.googleTitle}>Continue with Google</div>
          {googleClientId ? (
            <div ref={googleButtonRef} className={styles.googleButton} />
          ) : (
            <div className={styles.googleHint}>Set VITE_GOOGLE_CLIENT_ID to enable Google sign-in.</div>
          )}
          {googleClientId && !isGoogleReady && <div className={styles.googleHint}>Loading Google sign-in...</div>}
        </div>

        <p className={styles.note}>
          Authentication now runs through the backend so credentials are never stored in browser local storage.
        </p>

        <button
          type="button"
          className={styles.guestButton}
          onClick={() => navigate('/learn')}
        >
          Continue as Guest
        </button>
      </motion.section>
    </div>
  );
};
