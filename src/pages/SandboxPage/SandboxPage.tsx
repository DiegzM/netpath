import React from 'react';
import { useCanvasStore }  from '../../store/useCanvasStore';
import { NetworkCanvas }   from '../../components/Canvas/NetworkCanvas';
import { DeviceIcon }      from '../../components/UI/DeviceIcon';
import type { DeviceKind } from '../../types/device';
import styles from './SandboxPage.module.css';

const ALL_DEVICES: { kind: DeviceKind; label: string; desc: string }[] = [
  { kind: 'host',         label: 'Host',         desc: 'PC or server'      },
  { kind: 'switch',       label: 'Switch',       desc: 'Layer 2 LAN hub'   },
  { kind: 'router',       label: 'Router',       desc: 'Layer 3 forwarder' },
  { kind: 'access-point', label: 'Access Point', desc: 'Wi-Fi node'        },
  { kind: 'dns-server',   label: 'DNS Server',   desc: 'Name resolution'   },
  { kind: 'firewall',     label: 'Firewall',     desc: 'Traffic filter'    },
  { kind: 'internet',     label: 'Internet',     desc: 'External network'  },
];

export const SandboxPage: React.FC = () => {
  const { devices, connections, clearCanvas } = useCanvasStore();

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
            <div key={kind} className={styles.item}
              draggable
              onDragStart={e => e.dataTransfer.setData('deviceKind', kind)}>
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

        <button className={styles.clearBtn} onClick={clearCanvas}>Clear Canvas</button>
      </aside>

      <div className={styles.canvasWrap}>
        <NetworkCanvas />
      </div>
    </div>
  );
};
