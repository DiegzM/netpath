import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import styles from './AppShell.module.css';

const NAV_ITEMS = [
  { path: '/learn',    label: 'Learn',    icon: '▶' },
  { path: '/sandbox',  label: 'Sandbox',  icon: '⊞' },
  { path: '/progress', label: 'Progress', icon: '◈' },
];

interface AppShellProps { children: React.ReactNode; }

export const AppShell: React.FC<AppShellProps> = ({ children }) => {
  const location = useLocation();
  const isLanding = location.pathname === '/';

  return (
    <div className={styles.shell}>
      {!isLanding && (
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
            <div className={styles.avatar} title="Profile" />
          </div>
        </header>
      )}

      <main className={`${styles.content} ${isLanding ? styles.full : ''}`}>
        {children}
      </main>
    </div>
  );
};
