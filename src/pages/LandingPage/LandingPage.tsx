import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import styles from './LandingPage.module.css';

const fadeUp = (delay: number) => ({
  initial:    { opacity: 0, y: 24 },
  animate:    { opacity: 1, y: 0 },
  transition: { duration: 0.5, ease: [0.4, 0, 0.2, 1], delay },
});

const STATS = [
  { value: '5',  label: 'guided stages' },
  { value: '7',  label: 'device types'  },
  { value: '2',  label: 'curriculum arcs' },
];

export const LandingPage: React.FC = () => {
  const nav = useNavigate();
  return (
    <div className={styles.page}>
      <div className={styles.grid}    aria-hidden />
      <div className={styles.glowL}   aria-hidden />
      <div className={styles.glowR}   aria-hidden />

      <div className={styles.center}>
        <motion.div className={styles.eyebrow} {...fadeUp(0.05)}>
          ▶ Interactive Networking Education
        </motion.div>

        <motion.h1 className={styles.headline} {...fadeUp(0.15)}>
          <span className={styles.net}>Net</span>
          <span className={styles.path}>Path</span>
        </motion.h1>

        <motion.p className={styles.tagline} {...fadeUp(0.25)}>
          Learn networking by building it. Drag devices, draw cables,<br />
          simulate traffic — no theory-only lectures.
        </motion.p>

        <motion.div className={styles.ctas} {...fadeUp(0.35)}>
          <button className={styles.primary}   onClick={() => nav('/learn')}>Start Learning →</button>
          <button className={styles.secondary} onClick={() => nav('/sandbox')}>Open Sandbox</button>
        </motion.div>

        <motion.div className={styles.stats} {...fadeUp(0.45)}>
          {STATS.map(s => (
            <div key={s.label} className={styles.stat}>
              <span className={styles.statVal}>{s.value}</span>
              <span className={styles.statLbl}>{s.label}</span>
            </div>
          ))}
        </motion.div>
      </div>

      <motion.div className={styles.watermark} {...fadeUp(0.55)}>
        netpath.io — confidential · March 2026
      </motion.div>
    </div>
  );
};
