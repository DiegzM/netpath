import React, { useEffect } from 'react';
import { NetworkCanvas } from '../../components/Canvas/NetworkCanvas';
import { DeviceIcon } from '../../components/UI/DeviceIcon';
import { canSimulateTraffic } from '../../engine/simulation';
import { useCanvasStore } from '../../store/useCanvasStore';
import { useSimStore } from '../../store/useSimStore';
import type { DeviceKind } from '../../types/device';
import styles from './SandboxPage.module.css';

const ALL_DEVICES: { kind: DeviceKind; label: string; desc: string }[] = [
  { kind: 'host', label: 'Host', desc: 'PC or server' },
  { kind: 'switch', label: 'Switch', desc: 'Layer 2 LAN hub' },
  { kind: 'router', label: 'Router', desc: 'Layer 3 forwarder' },
  { kind: 'access-point', label: 'Access Point', desc: 'Wi-Fi node' },
  { kind: 'dns-server', label: 'DNS Server', desc: 'Name resolution' },
  { kind: 'firewall', label: 'Firewall', desc: 'Traffic filter' },
  { kind: 'internet', label: 'Internet', desc: 'External network' },
];

export const SandboxPage: React.FC = () => {
  const { devices, connections, clearCanvas } = useCanvasStore();
  const { toggle, tick, stop, isSimulating, simState } = useSimStore();
  const canSimulate = canSimulateTraffic(devices, connections);

  useEffect(() => {
    if (!isSimulating) return;
    const id = setInterval(tick, 600);
    return () => clearInterval(id);
  }, [isSimulating, tick]);

  function handleClearCanvas() {
    stop();
    clearCanvas();
  }

  return (
    <div className={styles.page}>
      <aside className={styles.sidebar}>
        <div className={styles.header}>
          <div className={styles.title}>Free Sandbox</div>
          <div className={styles.sub}>Build any topology</div>
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
          <button className={`${styles.actionBtn} ${styles.simulateBtn}`} disabled={!canSimulate} onClick={toggle}>
            {isSimulating ? 'Stop Stream' : 'Start Stream'}
          </button>
          <button className={`${styles.actionBtn} ${styles.clearBtn}`} onClick={handleClearCanvas}>
            Clear Canvas
          </button>
          <p className={styles.actionHint}>
            {isSimulating
              ? `${simState.packets.length} active packet${simState.packets.length === 1 ? '' : 's'} crossing reachable hosts and internet nodes.`
              : 'Create at least two reachable endpoints. Hosts and the internet both count as valid traffic endpoints.'}
          </p>
        </div>
      </aside>

      <div className={styles.canvasWrap}>
        <NetworkCanvas />
      </div>
    </div>
  );
};
