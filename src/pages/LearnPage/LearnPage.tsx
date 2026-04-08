import React, { useEffect } from 'react';
import { useCanvasStore } from '../../store/useCanvasStore';
import { useCurriculumStore } from '../../store/useCurriculumStore';
import { useSimStore } from '../../store/useSimStore';
import { NetworkCanvas } from '../../components/Canvas/NetworkCanvas';
import { DeviceIcon } from '../../components/UI/DeviceIcon';
import { STAGES } from '../../data/stages';
import { canSimulateTraffic } from '../../engine/simulation';
import type { DeviceKind } from '../../types/device';
import styles from './LearnPage.module.css';

const STATUS = {
  idle: { label: 'Not connected', color: '#5a7090' },
  partial: { label: 'Partially connected', color: '#d69e2e' },
  valid: { label: 'Network valid', color: '#38b2ac' },
  invalid: { label: 'Invalid topology', color: '#e53e3e' },
};

const ALL_DEVICES: { kind: DeviceKind; label: string }[] = [
  { kind: 'host', label: 'Host' },
  { kind: 'switch', label: 'Switch' },
  { kind: 'router', label: 'Router' },
  { kind: 'access-point', label: 'Access Point' },
  { kind: 'dns-server', label: 'DNS Server' },
  { kind: 'firewall', label: 'Firewall' },
  { kind: 'internet', label: 'Internet' },
];

const LearnSidebar: React.FC = () => {
  const { devices } = useCanvasStore();
  const { currentStageIndex, validationStatus, showHint, toggleHint } = useCurriculumStore();
  const stage = STAGES[currentStageIndex];
  const status = STATUS[validationStatus];
  const canAdd = stage.targetDeviceKinds.filter((kind) => !devices.some((device) => device.kind === kind));

  function handleDragStart(event: React.DragEvent, kind: DeviceKind) {
    event.dataTransfer.setData('deviceKind', kind);
  }

  function renderTheory(text: string) {
    return text.split(/(\*\*[^*]+\*\*)/g).map((part, index) =>
      part.startsWith('**') ? <strong key={index}>{part.slice(2, -2)}</strong> : part,
    );
  }

  return (
    <aside className={styles.sidebar}>
      <div className={styles.arcTag}>ARC {stage.arc} - {stage.arc === 1 ? 'LAN FUNDAMENTALS' : 'WAN & INTERNET'}</div>

      <div className={styles.stageHead}>
        <h2 className={styles.stageTitle}>{stage.title}</h2>
        <p className={styles.stageSub}>{stage.subtitle}</p>
      </div>

      <section className={styles.section}>
        <div className={styles.sLabel}>How It Works</div>
        {stage.theory.map((paragraph, index) => (
          <p key={index} className={styles.theoryP}>{renderTheory(paragraph)}</p>
        ))}
      </section>

      <div className={`${styles.taskBox} ${styles[validationStatus]}`}>
        <div className={styles.taskLabel}>Your Task</div>
        <p className={styles.taskText}>{stage.task}</p>
        <span className={styles.statusChip} style={{ color: status.color, borderColor: `${status.color}55` }}>
          {status.label}
        </span>
      </div>

      {canAdd.length > 0 && (
        <section className={styles.section}>
          <div className={styles.sLabel}>Drag To Canvas</div>
          <div className={styles.palette}>
            {canAdd.map((kind) => (
              <div
                key={kind}
                className={styles.paletteItem}
                draggable
                onDragStart={(event) => handleDragStart(event, kind)}
              >
                <DeviceIcon kind={kind} size={24} />
                <span>{ALL_DEVICES.find((device) => device.kind === kind)?.label}</span>
              </div>
            ))}
          </div>
        </section>
      )}

      <button className={styles.hintBtn} onClick={toggleHint}>
        {showHint ? 'Hide hint' : 'Show hint'}
      </button>
      {showHint && <div className={styles.hintBox}>{stage.hint}</div>}
    </aside>
  );
};

const LearnToolbar: React.FC = () => {
  const { currentStageIndex, validationStatus, validate, goToStage } = useCurriculumStore();
  const { devices, connections, resetToStage } = useCanvasStore();
  const { toggle, tick, stop, isSimulating, simState } = useSimStore();
  const canSimulate = canSimulateTraffic(devices, connections);
  const canNext = validationStatus === 'valid' && currentStageIndex < STAGES.length - 1;

  useEffect(() => {
    if (!isSimulating) return;
    const id = setInterval(tick, 600);
    return () => clearInterval(id);
  }, [isSimulating, tick]);

  function handleReset() {
    stop();
    resetToStage(currentStageIndex);
  }

  return (
    <footer className={styles.toolbar}>
      <span className={styles.stageMeta}>Stage {STAGES[currentStageIndex].id} of {STAGES.length}</span>
      <div className={styles.actions}>
        <button className={`${styles.btn} ${styles.simulate}`} disabled={!canSimulate} onClick={toggle}>
          {isSimulating ? 'Stop Stream' : 'Start Stream'}
        </button>
        <button
          className={`${styles.btn} ${styles.check} ${validationStatus === 'valid' ? styles.checkValid : ''}`}
          onClick={validate}
        >
          Check
        </button>
        <button className={`${styles.btn} ${styles.reset}`} onClick={handleReset}>
          Reset
        </button>
        {canNext && (
          <button className={`${styles.btn} ${styles.next}`} onClick={() => goToStage(currentStageIndex + 1)}>
            Next {'->'}
          </button>
        )}
      </div>
      <span className={styles.simMeta}>
        {isSimulating
          ? `${simState.packets.length} active packet${simState.packets.length === 1 ? '' : 's'}`
          : 'Traffic stream is available when two reachable endpoints exist'}
      </span>
    </footer>
  );
};

const StageTabs: React.FC = () => {
  const { currentStageIndex, completedStages, goToStage } = useCurriculumStore();

  return (
    <div className={styles.tabs}>
      {STAGES.map((stage, index) => (
        <button
          key={stage.id}
          className={`${styles.tab}
            ${index === currentStageIndex ? styles.tabActive : ''}
            ${completedStages.includes(stage.id) ? styles.tabDone : ''}`}
          onClick={() => goToStage(index)}
          title={stage.title}
        >
          {index + 1}
        </button>
      ))}
    </div>
  );
};

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
