import React, { useEffect, useState } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../auth/AuthContext';
import styles from './AppShell.module.css';

const NAV_ITEMS = [
  { path: '/learn',    label: 'Learn',    icon: '▶' },
  { path: '/sandbox',  label: 'Sandbox',  icon: '⊞' },
  { path: '/progress', label: 'Progress', icon: '◈' },
];

interface AppShellProps { children: React.ReactNode; }

export const AppShell: React.FC<AppShellProps> = ({ children }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [avatarErrored, setAvatarErrored] = useState(false);
  const isLanding = location.pathname === '/';
  const isAuth = location.pathname === '/auth';
  const hideNav = isLanding || isAuth;
  const initials = user?.name.trim().charAt(0).toUpperCase() ?? '?';
  const avatarUrl = user?.avatarUrl?.trim() ?? '';

  useEffect(() => {
    setAvatarErrored(false);
  }, [avatarUrl]);

  return (
    <div className={styles.shell}>
      {!hideNav && (
        <header className={styles.nav}>
          <NavLink to="/" className={styles.logo}>
            <span className={styles.net}>Net</span>
            <span className={styles.path}>Path</span>
          </NavLink>

          <nav className={styles.links}>
            {NAV_ITEMS.map(({ path, label, icon }) => (
              <NavLink key={path} to={path}
                className={({ isActive }) => `${styles.link} ${isActive ? styles.active : ''}`}>
                <span className={styles.icon}>{icon}</span>{label}
              </NavLink>
            ))}
          </nav>

          <div className={styles.right}>
            {user ? (
              <>
                <button
                  type="button"
                  className={styles.identityBtn}
                  onClick={() => navigate('/settings', { state: { from: location.pathname } })}
                >
                  <div className={styles.identity}>
                    <div className={styles.userName}>{user.name}</div>
                    <div className={styles.userEmail}>{user.email}</div>
                  </div>
                  <div className={styles.avatar} title={user.name}>
                    {avatarUrl && !avatarErrored ? (
                      <img
                        src={avatarUrl}
                        alt={`${user.name} avatar`}
                        className={styles.avatarImg}
                        referrerPolicy="no-referrer"
                        crossOrigin="anonymous"
                        onError={() => setAvatarErrored(true)}
                      />
                    ) : (
                      initials
                    )}
                  </div>
                </button>
                <button className={styles.logout} onClick={async () => { await logout(); navigate('/auth'); }}>
                  Sign Out
                </button>
              </>
            ) : (
              <button className={styles.logout} onClick={() => navigate('/auth')}>
                Sign In
              </button>
            )}
          </div>
        </header>
      )}

      <main className={`${styles.content} ${hideNav ? styles.full : ''}`}>
        {children}
      </main>
    </div>
  );
};
