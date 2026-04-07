import React, { useEffect } from 'react';
import { useNavigate }           from 'react-router-dom';
import { useCanvasStore }        from '../../store/useCanvasStore';
import { useCurriculumStore }    from '../../store/useCurriculumStore';
import { useSimStore }           from '../../store/useSimStore';
import { NetworkCanvas }         from '../../components/Canvas/NetworkCanvas';
import { DeviceIcon }            from '../../components/UI/DeviceIcon';
import { STAGES }                from '../../data/stages';
import type { DeviceKind }       from '../../types/device';
import styles from './LearnPage.module.css';

// ─── Status config ─────────────────────────────────────────────────────────────
const STATUS = {
  idle:    { label: 'Not connected',        color: '#5a7090' },
  partial: { label: 'Partially connected',  color: '#d69e2e' },
  valid:   { label: 'Network valid ✓',      color: '#38b2ac' },
  invalid: { label: 'Invalid topology',     color: '#e53e3e' },
};

const ALL_DEVICES: { kind: DeviceKind; label: string }[] = [
  { kind: 'host',         label: 'Host'         },
  { kind: 'switch',       label: 'Switch'       },
  { kind: 'router',       label: 'Router'       },
  { kind: 'access-point', label: 'Access Point' },
  { kind: 'dns-server',   label: 'DNS Server'   },
  { kind: 'firewall',     label: 'Firewall'     },
  { kind: 'internet',     label: 'Internet'     },
];

// ─── Sidebar ───────────────────────────────────────────────────────────────────

const LearnSidebar: React.FC = () => {
  const { devices }                           = useCanvasStore();
  const { currentStageIndex, validationStatus, showHint, toggleHint } = useCurriculumStore();
  const stage  = STAGES[currentStageIndex];
  const status = STATUS[validationStatus];

  const canAdd = stage.targetDeviceKinds.filter(k => !devices.some(d => d.kind === k));

  function handleDragStart(e: React.DragEvent, kind: DeviceKind) {
    e.dataTransfer.setData('deviceKind', kind);
  }

  function renderTheory(text: string) {
    return text.split(/(\*\*[^*]+\*\*)/g).map((p, i) =>
      p.startsWith('**') ? <strong key={i}>{p.slice(2, -2)}</strong> : p
    );
  }

  return (
    <aside className={styles.sidebar}>
      <div className={styles.arcTag}>ARC {stage.arc} — {stage.arc === 1 ? 'LAN FUNDAMENTALS' : 'WAN & INTERNET'}</div>

      <div className={styles.stageHead}>
        <h2 className={styles.stageTitle}>{stage.title}</h2>
        <p className={styles.stageSub}>{stage.subtitle}</p>
      </div>

      <section className={styles.section}>
        <div className={styles.sLabel}>▶ HOW IT WORKS</div>
        {stage.theory.map((p, i) => (
          <p key={i} className={styles.theoryP}>{renderTheory(p)}</p>
        ))}
      </section>

      <div className={`${styles.taskBox} ${styles[validationStatus]}`}>
        <div className={styles.taskLabel}>🎯 YOUR TASK</div>
        <p className={styles.taskText}>{stage.task}</p>
        <span className={styles.statusChip} style={{ color: status.color, borderColor: status.color + '55' }}>
          {status.label}
        </span>
      </div>

      {canAdd.length > 0 && (
        <section className={styles.section}>
          <div className={styles.sLabel}>DRAG TO CANVAS</div>
          <div className={styles.palette}>
            {canAdd.map(kind => (
              <div key={kind} className={styles.paletteItem}
                draggable onDragStart={e => handleDragStart(e, kind)}>
                <DeviceIcon kind={kind} size={24} />
                <span>{ALL_DEVICES.find(d => d.kind === kind)?.label}</span>
              </div>
            ))}
          </div>
        </section>
      )}

      <button className={styles.hintBtn} onClick={toggleHint}>
        💡 {showHint ? 'Hide hint' : 'Show hint'}
      </button>
      {showHint && <div className={styles.hintBox}>{stage.hint}</div>}
    </aside>
  );
};

// ─── Bottom toolbar ────────────────────────────────────────────────────────────

const LearnToolbar: React.FC = () => {
  const nav = useNavigate();
  const { currentStageIndex, validationStatus, validate, goToStage } = useCurriculumStore();
  const { resetToStage }   = useCanvasStore();
  const { run, tick, stop, isSimulating } = useSimStore();

  // Drive packet animation tick
  useEffect(() => {
    if (!isSimulating) return;
    const id = setInterval(tick, 600);
    return () => clearInterval(id);
  }, [isSimulating, tick]);

  const canNext = validationStatus === 'valid' && currentStageIndex < STAGES.length - 1;

  function handleReset() {
    stop();
    resetToStage(currentStageIndex);
  }

  return (
    <footer className={styles.toolbar}>
      <span className={styles.stageMeta}>Stage {STAGES[currentStageIndex].id} of {STAGES.length}</span>
      <div className={styles.actions}>
        <button className={`${styles.btn} ${styles.simulate}`}
          disabled={validationStatus !== 'valid' || isSimulating} onClick={run}>
          🔸 Simulate
        </button>
        <button className={`${styles.btn} ${styles.check} ${validationStatus === 'valid' ? styles.checkValid : ''}`}
          onClick={validate}>
          ✔ Check
        </button>
        <button className={`${styles.btn} ${styles.reset}`} onClick={handleReset}>↺ Reset</button>
        {canNext && (
          <button className={`${styles.btn} ${styles.next}`} onClick={() => goToStage(currentStageIndex + 1)}>
            Next →
          </button>
        )}
      </div>
    </footer>
  );
};

// ─── Stage tabs ────────────────────────────────────────────────────────────────

const StageTabs: React.FC = () => {
  const { currentStageIndex, completedStages, goToStage } = useCurriculumStore();
  return (
    <div className={styles.tabs}>
      {STAGES.map((s, i) => (
        <button key={s.id}
          className={`${styles.tab}
            ${i === currentStageIndex          ? styles.tabActive : ''}
            ${completedStages.includes(s.id)   ? styles.tabDone   : ''}`}
          onClick={() => goToStage(i)} title={s.title}>
          {i + 1}
        </button>
      ))}
    </div>
  );
};

// ─── Page ──────────────────────────────────────────────────────────────────────

export const LearnPage: React.FC = () => (
  <div className={styles.page}>
    <StageTabs />
    <div className={styles.body}>
      <LearnSidebar />
      <div className={styles.workspace}>
        <NetworkCanvas />
        <LearnToolbar />
      </div>
    </div>
  </div>
);
