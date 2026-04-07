import React from 'react';
import { useNavigate }          from 'react-router-dom';
import { motion }               from 'framer-motion';
import { useCurriculumStore }   from '../../store/useCurriculumStore';
import { DeviceIcon }           from '../../components/UI/DeviceIcon';
import { STAGES }               from '../../data/stages';
import styles from './ProgressPage.module.css';

const cardVariants = {
  initial: { opacity: 0, y: 16 },
  animate: (i: number) => ({
    opacity: 1, y: 0,
    transition: { duration: 0.35, ease: [0.4, 0, 0.2, 1] as const, delay: i * 0.07 },
  }),
};

export const ProgressPage: React.FC = () => {
  const { completedStages, goToStage } = useCurriculumStore();
  const nav = useNavigate();
  const pct = Math.round((completedStages.length / STAGES.length) * 100);

  function handleGo(index: number) {
    goToStage(index);
    nav('/learn');
  }

  return (
    <div className={styles.page}>
      <div className={styles.inner}>
        <motion.div className={styles.header}
          initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}>
          <h1 className={styles.heading}>Your Progress</h1>
          <p className={styles.sub}>{completedStages.length} of {STAGES.length} stages complete</p>
        </motion.div>

        <motion.div className={styles.barWrap}
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1, duration: 0.4 }}>
          <div className={styles.track}>
            <motion.div className={styles.fill}
              initial={{ width: 0 }} animate={{ width: `${pct}%` }}
              transition={{ delay: 0.25, duration: 0.6, ease: 'easeOut' }} />
          </div>
          <span className={styles.pct}>{pct}%</span>
        </motion.div>

        <div className={styles.grid}>
          {STAGES.map((stage, i) => {
            const done   = completedStages.includes(stage.id);
            const locked = !done && i > 0 && !completedStages.includes(STAGES[i - 1]?.id);
            return (
              <motion.div key={stage.id}
                className={`${styles.card} ${done ? styles.done : ''} ${locked ? styles.locked : ''}`}
                variants={cardVariants} initial="initial" animate="animate" custom={i}
                onClick={() => !locked && handleGo(i)}>
                <div className={styles.badge}>{stage.id}</div>
                <div className={styles.arc}>Arc {stage.arc}</div>
                <h3 className={styles.cardTitle}>{stage.title}</h3>
                <p className={styles.cardSub}>{stage.subtitle}</p>
                <div className={styles.deviceRow}>
                  {stage.preplacedDevices.slice(0, 5).map((d, di) => (
                    <DeviceIcon key={di} kind={d.kind} size={16} color={done ? '#38b2ac' : '#2a4060'} />
                  ))}
                </div>
                <div className={styles.statusRow}>
                  {done   ? <span className={styles.tagDone}>✓ Completed</span>
                  : locked ? <span className={styles.tagLocked}>🔒 Locked</span>
                  :          <span className={styles.tagOpen}>→ Start</span>}
                </div>
              </motion.div>
            );
          })}
        </div>

        {completedStages.length === STAGES.length && (
          <motion.div className={styles.allDone}
            initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.4, duration: 0.4 }}>
            🎉 Arc 1 complete! Arc 2 — Wide Area Networks — coming soon.
          </motion.div>
        )}
      </div>
    </div>
  );
};
