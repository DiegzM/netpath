import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { NetworkCanvas } from '../../components/Canvas/NetworkCanvas';
import { hasRunnableTraffic, type SinglePacketRequest } from '../../components/Canvas/hooks/usePacketSimulation';
import { DeviceIcon } from '../../components/UI/DeviceIcon';
import { useCanvasStore } from '../../store/useCanvasStore';
import { getWorld, saveWorld } from '../../api/worlds';
import { generateWorldThumbnail } from '../../utils/generateWorldThumbnail';
import type { DeviceKind } from '../../types/device';
import styles from './SandboxPage.module.css';

type SaveStatus = 'idle' | 'saving' | 'saved' | 'error';

const ALL_DEVICES: { kind: DeviceKind; label: string; desc: string }[] = [
  { kind: 'pc', label: 'PC', desc: 'Personal computer' },
  { kind: 'server', label: 'Server', desc: 'Service provider' },
  { kind: 'switch', label: 'Switch', desc: 'Layer 2 LAN hub' },
  { kind: 'router', label: 'Router', desc: 'Layer 3 forwarder' },
  { kind: 'internet', label: 'Internet', desc: 'External network' },
];

export const SandboxPage: React.FC = () => {
  const { worldId } = useParams<{ worldId: string }>();
  const navigate = useNavigate();
  const { devices, connections, loadCanvas, clearCanvas } = useCanvasStore();

  // ── World metadata ─────────────────────────────────────────────────────────
  const [worldTitle, setWorldTitle] = useState('Untitled World');
  const [worldDesc]  = useState('');
  const [loadError, setLoadError] = useState('');
  const [loadingWorld, setLoadingWorld] = useState(true);

  // ── Save status ────────────────────────────────────────────────────────────
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle');
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const periodicRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const isMountedRef = useRef(true);
  const worldTitleRef = useRef(worldTitle);
  const worldDescRef  = useRef(worldDesc);
  worldTitleRef.current = worldTitle;
  worldDescRef.current  = worldDesc;

  // ── Simulation controls ────────────────────────────────────────────────────
  const [isSimulationRunning, setIsSimulationRunning] = useState(false);
  const [singlePacketRequest, setSinglePacketRequest] = useState<SinglePacketRequest | null>(null);
  const [showPacketPicker, setShowPacketPicker] = useState(false);
  const [sourceId, setSourceId] = useState('');
  const [destinationId, setDestinationId] = useState('');
  const [requestCounter, setRequestCounter] = useState(0);

  const canSimulate = hasRunnableTraffic(devices, connections);
  const endpoints = useMemo(
    () => devices.filter((d) => d.kind === 'pc' || d.kind === 'server' || d.kind === 'internet'),
    [devices],
  );

  // ── Load world on mount ────────────────────────────────────────────────────
  useEffect(() => {
    isMountedRef.current = true;
    if (!worldId) { navigate('/sandbox'); return; }

    setLoadingWorld(true);
    getWorld(worldId)
      .then((world) => {
        if (!isMountedRef.current) return;
        setWorldTitle(world.title);
        const { devices: savedDevices, connections: savedConnections } = world.canvasData;
        loadCanvas(savedDevices ?? [], savedConnections ?? []);
        setSaveStatus('saved');
      })
      .catch(() => {
        if (!isMountedRef.current) return;
        setLoadError('Could not load this world. It may have been deleted.');
      })
      .finally(() => {
        if (isMountedRef.current) setLoadingWorld(false);
      });

    return () => { isMountedRef.current = false; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [worldId]);

  // ── Persist helper ─────────────────────────────────────────────────────────
  const persist = useCallback(async () => {
    if (!worldId) return;
    setSaveStatus('saving');
    try {
      const { devices: d, connections: c } = useCanvasStore.getState();
      const thumbnailData = generateWorldThumbnail(d, c);
      await saveWorld(worldId, {
        title:         worldTitleRef.current,
        description:   worldDescRef.current,
        thumbnailData,
        canvasData:    { devices: d, connections: c, simulationSettings: {} },
      });
      if (isMountedRef.current) setSaveStatus('saved');
    } catch {
      if (isMountedRef.current) setSaveStatus('error');
    }
  }, [worldId]);

  // ── Debounced autosave on canvas edits ─────────────────────────────────────
  useEffect(() => {
    if (loadingWorld) return;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    setSaveStatus('idle');
    debounceRef.current = setTimeout(() => { persist(); }, 2000);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [devices, connections, loadingWorld]);

  // ── Periodic autosave every 15 s ───────────────────────────────────────────
  useEffect(() => {
    if (loadingWorld) return;
    periodicRef.current = setInterval(persist, 15_000);
    return () => { if (periodicRef.current) clearInterval(periodicRef.current); };
  }, [loadingWorld, persist]);

  function handleClearCanvas() {
    setIsSimulationRunning(false);
    clearCanvas();
  }

  function toggleNetworkSimulation() {
    if (!canSimulate) return;
    setIsSimulationRunning((running) => !running);
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

  if (loadingWorld) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', fontSize: '12px' }}>
        Loading world…
      </div>
    );
  }

  if (loadError) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: '12px' }}>
        <p style={{ color: 'var(--error)', fontFamily: 'var(--font-mono)', fontSize: '12px' }}>{loadError}</p>
        <button onClick={() => navigate('/sandbox')} style={{ background: 'none', border: '1px solid var(--teal)', color: 'var(--teal)', fontFamily: 'var(--font-mono)', fontSize: '11px', padding: '7px 16px', borderRadius: '4px', cursor: 'pointer' }}>← Back to worlds</button>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <aside className={styles.sidebar}>
        <div className={styles.header}>
          <div className={styles.titleRow}>
            <div
              className={styles.title}
              contentEditable
              suppressContentEditableWarning
              onBlur={(e) => setWorldTitle(e.currentTarget.textContent?.trim() || 'Untitled World')}
            >
              {worldTitle}
            </div>
            <button className={styles.backBtn} onClick={() => navigate('/sandbox')} title="Back to worlds">←</button>
          </div>
          <div className={styles.sub}>Sandbox World</div>
        </div>

        <div className={styles.sLabel}>DEVICES</div>
        <div className={styles.palette}>
          {ALL_DEVICES.map(({ kind, label, desc }) => (
            <div
              key={kind}
              className={styles.item}
              draggable
              onDragStart={(event) => event.dataTransfer.setData('deviceKind', kind)}
            >
              <DeviceIcon kind={kind} size={26} />
              <div>
                <div className={styles.itemLabel}>{label}</div>
                <div className={styles.itemDesc}>{desc}</div>
              </div>
            </div>
          ))}
        </div>

        <div className={styles.stats}>
          <div className={styles.stat}>
            <span className={styles.statN}>{devices.length}</span>
            <span className={styles.statL}>devices</span>
          </div>
          <div className={styles.stat}>
            <span className={styles.statN}>{connections.length}</span>
            <span className={styles.statL}>cables</span>
          </div>
        </div>

        <div className={styles.actions}>
          <button
            className={`${styles.actionBtn} ${styles.networkBtn} ${isSimulationRunning ? styles.networkActive : ''}`}
            disabled={!canSimulate}
            onClick={toggleNetworkSimulation}
          >
            {isSimulationRunning ? 'Stop Network' : 'Simulate Network'}
          </button>

          <button
            className={`${styles.actionBtn} ${styles.packetBtn}`}
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

          <button className={`${styles.actionBtn} ${styles.clearBtn}`} onClick={handleClearCanvas}>
            Clear Canvas
          </button>
          <p className={styles.actionHint}>
            Click and drag nodes to reposition. Click one node then another to create a cable.
          </p>
        </div>
      </aside>

      <div className={styles.canvasWrap}>
                <div className={styles.topBar}>
                  <span className={`${styles.saveStatus} ${styles[`saveStatus_${saveStatus}`]}`}>
                    {saveStatus === 'saving' && 'Saving...'}
                    {saveStatus === 'saved'  && 'Saved'}
                    {saveStatus === 'error'  && 'Save Failed'}
                  </span>
                  <button
                    className={styles.manualSaveBtn}
                    onClick={persist}
                    disabled={saveStatus === 'saving'}
                  >
                    Save
                  </button>
                </div>
        <NetworkCanvas
          isSimulationRunning={isSimulationRunning && canSimulate}
          singlePacketRequest={singlePacketRequest}
        />
      </div>
    </div>
  );
};
