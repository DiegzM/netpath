import React, { useMemo, useState } from 'react';
import { useCanvasStore } from '../../store/useCanvasStore';
import { useCurriculumStore } from '../../store/useCurriculumStore';
import { NetworkCanvas } from '../../components/Canvas/NetworkCanvas';
import { hasRunnableTraffic, type SinglePacketRequest } from '../../components/Canvas/hooks/usePacketSimulation';
import { DeviceIcon } from '../../components/UI/DeviceIcon';
import { STAGES } from '../../data/stages';
import type { Device, DeviceKind } from '../../types/device';
import styles from './LearnPage.module.css';

const STATUS = {
  idle: { label: 'Not connected', color: '#5a7090' },
  partial: { label: 'Partially connected', color: '#d69e2e' },
  valid: { label: 'Network valid', color: '#38b2ac' },
  invalid: { label: 'Invalid topology', color: '#e53e3e' },
};

const ALL_DEVICES: { kind: DeviceKind; label: string }[] = [
  { kind: 'pc', label: 'PC' },
  { kind: 'server', label: 'Server' },
  { kind: 'switch', label: 'Switch' },
  { kind: 'router', label: 'Router' },
  { kind: 'internet', label: 'Internet' },
];

interface PaletteItem {
  key: string;
  kind: DeviceKind;
  label: string;
  template?: Device;
}

interface LearnSidebarProps {
  isSimulationRunning: boolean;
  setIsSimulationRunning: (running: boolean) => void;
  setSinglePacketRequest: (request: SinglePacketRequest | null) => void;
}

const LearnSidebar: React.FC<LearnSidebarProps> = ({
  isSimulationRunning,
  setIsSimulationRunning,
  setSinglePacketRequest,
}) => {
  const { devices, connections } = useCanvasStore();
  const { currentStageIndex, validationStatus, showHint, toggleHint } = useCurriculumStore();
  const stage = STAGES[currentStageIndex];
  const status = STATUS[validationStatus];
  const canSimulate = hasRunnableTraffic(devices, connections);

  const endpoints = useMemo(
    () => devices.filter((d) => d.kind === 'pc' || d.kind === 'server' || d.kind === 'internet'),
    [devices],
  );

  const [showPacketPicker, setShowPacketPicker] = useState(false);
  const [sourceId, setSourceId] = useState('');
  const [destinationId, setDestinationId] = useState('');
  const [requestCounter, setRequestCounter] = useState(0);

  const missingStageDevices: PaletteItem[] = stage.preplacedDevices
    .filter((stageDevice) => !devices.some((device) => device.id === stageDevice.id))
    .map((stageDevice) => ({
      key: `stage-${stageDevice.id}`,
      kind: stageDevice.kind,
      label: stageDevice.label,
      template: stageDevice,
    }));
  const missingTargetDevices: PaletteItem[] = stage.targetDeviceKinds
    .filter((kind) => !devices.some((device) => device.kind === kind))
    .map((kind) => ({
      key: `target-${kind}`,
      kind,
      label: ALL_DEVICES.find((device) => device.kind === kind)?.label ?? kind,
    }));
  const canAdd = [...missingStageDevices, ...missingTargetDevices];

  function handleDragStart(event: React.DragEvent, item: PaletteItem) {
    event.dataTransfer.setData('deviceKind', item.kind);
    if (item.template) {
      event.dataTransfer.setData('deviceTemplate', JSON.stringify(item.template));
    }
  }

  function renderTheory(text: string) {
    return text.split(/(\*\*[^*]+\*\*)/g).map((part, index) =>
      part.startsWith('**') ? <strong key={index}>{part.slice(2, -2)}</strong> : part,
    );
  }

  function toggleNetworkSimulation() {
    if (!canSimulate) return;
    setIsSimulationRunning(!isSimulationRunning);
  }

  function openPacketPrompt() {
    setShowPacketPicker((open) => !open);
    if (endpoints.length >= 2 && !sourceId) {
      setSourceId(endpoints[0].id);
      setDestinationId(endpoints[1].id);
    }
  }

  function runSinglePacket() {
    if (!sourceId || !destinationId || sourceId === destinationId) return;
    setIsSimulationRunning(false);
    const nextId = requestCounter + 1;
    setRequestCounter(nextId);
    setSinglePacketRequest({ sourceId, destinationId, requestId: nextId });
    setShowPacketPicker(false);
  }

  return (
    <aside className={styles.sidebar}>
      <div className={styles.arcTag}>ARC {stage.arc} - {stage.arc === 1 ? 'LAN FUNDAMENTALS' : 'ADVANCED NETWORKS'}</div>

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
            {canAdd.map((item) => (
              <div
                key={item.key}
                className={styles.paletteItem}
                draggable
                onDragStart={(event) => handleDragStart(event, item)}
              >
                <DeviceIcon kind={item.kind} size={24} />
                <span>{item.label}</span>
              </div>
            ))}
          </div>
        </section>
      )}

      <button className={styles.hintBtn} onClick={toggleHint}>
        {showHint ? 'Hide hint' : 'Show hint'}
      </button>
      {showHint && <div className={styles.hintBox}>{stage.hint}</div>}

      <div className={styles.simActions}>
        <button
          className={`${styles.simBtn} ${isSimulationRunning ? styles.stopBtn : ''}`}
          disabled={!canSimulate}
          onClick={toggleNetworkSimulation}
        >
          {isSimulationRunning ? 'Stop Network' : 'Simulate Network'}
        </button>
        <button
          className={styles.packetBtn}
          disabled={endpoints.length < 2}
          onClick={openPacketPrompt}
        >
          Simulate Packet
        </button>

        {showPacketPicker && (
          <div className={styles.packetPrompt}>
            <label>From</label>
            <select value={sourceId} onChange={(e) => setSourceId(e.target.value)}>
              {endpoints.map((d) => (
                <option key={d.id} value={d.id}>{d.label}</option>
              ))}
            </select>

            <label>To</label>
            <select value={destinationId} onChange={(e) => setDestinationId(e.target.value)}>
              {endpoints.filter((d) => d.id !== sourceId).map((d) => (
                <option key={d.id} value={d.id}>{d.label}</option>
              ))}
            </select>

            <button className={styles.packetSendBtn} onClick={runSinglePacket}>
              Send Packet
            </button>
          </div>
        )}
      </div>
    </aside>
  );
};

const LearnToolbar: React.FC = () => {
  const { currentStageIndex, validationStatus, validate, goToStage } = useCurriculumStore();
  const { resetToStage } = useCanvasStore();
  const stage = STAGES[currentStageIndex];

  const canNext = validationStatus === 'valid' && currentStageIndex < STAGES.length - 1;

  function handleReset() {
    resetToStage(currentStageIndex);
  }

  return (
    <footer className={styles.toolbar}>
      <span className={styles.stageMeta}>Stage {stage.id} of {STAGES.length}</span>
      <div className={styles.actions}>
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
      <span className={styles.simMeta}>Hold and drag from one node to another to connect them</span>
    </footer>
  );
};

const StageTabs: React.FC = () => {
  const { currentStageIndex, completedStages, goToStage } = useCurriculumStore();

  const maxUnlockedIndex = useMemo(() => {
    let unlocked = 0;
    for (let i = 0; i < STAGES.length; i += 1) {
      if (completedStages.includes(STAGES[i].id)) {
        unlocked = Math.min(i + 1, STAGES.length - 1);
        continue;
      }
      break;
    }
    return unlocked;
  }, [completedStages]);

  return (
    <div className={styles.tabs}>
      {STAGES.map((stage, index) => {
        const isLocked = index > maxUnlockedIndex;
        return (
          <button
            key={stage.id}
            className={`${styles.tab}
            ${index === currentStageIndex ? styles.tabActive : ''}
            ${completedStages.includes(stage.id) ? styles.tabDone : ''}
            ${isLocked ? styles.tabLocked : ''}`}
            disabled={isLocked}
            onClick={() => goToStage(index)}
            title={isLocked ? `${stage.title} (locked)` : stage.title}
          >
            {index + 1}
          </button>
        );
      })}
    </div>
  );
};

export const LearnPage: React.FC = () => {
  const [isSimulationRunning, setIsSimulationRunning] = useState(false);
  const [singlePacketRequest, setSinglePacketRequest] = useState<SinglePacketRequest | null>(null);

  return (
    <div className={styles.page}>
      <StageTabs />
      <div className={styles.body}>
        <LearnSidebar
          isSimulationRunning={isSimulationRunning}
          setIsSimulationRunning={setIsSimulationRunning}
          setSinglePacketRequest={setSinglePacketRequest}
        />
        <div className={styles.workspace}>
          <LearnToolbar />
          <NetworkCanvas
            isSimulationRunning={isSimulationRunning}
            singlePacketRequest={singlePacketRequest}
          />
        </div>
      </div>
    </div>
  );
};
