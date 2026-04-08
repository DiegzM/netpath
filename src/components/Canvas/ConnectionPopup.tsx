import React, { useEffect } from 'react';
import { useCanvasStore } from '../../store/useCanvasStore';
import type { ConnectionConfig, PortMode }  from '../../types/connection';
import styles from './NetworkCanvas.module.css';

interface ConnectionPopupProps {
  fromId?: string;
  toId?:   string;
  connId?: string;
  x:       number;
  y:       number;
  onClose: () => void;
}

export const ConnectionPopup: React.FC<ConnectionPopupProps> = ({
  fromId, toId, connId, x, y, onClose,
}) => {
  const { devices, connections, updateConnection, removeConnection } = useCanvasStore();

  const conn = connId
    ? connections.find(c => c.id === connId)
    : connections.find(
        c => (c.from === fromId && c.to === toId) ||
             (c.from === toId   && c.to === fromId)
      );

  const from = devices.find(d => d.id === conn?.from);
  const to   = devices.find(d => d.id === conn?.to);

  // Escape closes, Delete deletes
  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { onClose(); return; }
      if ((e.key === 'Delete' || e.key === 'Backspace') &&
          !['INPUT','SELECT','TEXTAREA'].includes((e.target as HTMLElement).tagName)) {
        handleDelete();
      }
    };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [conn, onClose]);

  if (!conn) return null;

  function update(patch: Partial<ConnectionConfig>) {
    if (!conn) return;
    updateConnection(conn.id, { config: { ...conn.config, ...patch } });
  }

  function handleDelete() {
    if (!conn) return;
    removeConnection(conn.id);
    onClose();
  }

  const showVlan = conn.config.portMode === 'access';
  const showIp   = from?.kind === 'router' && to?.kind === 'router';

  return (
    <>
      <div
        className={styles.popupBackdrop}
        onMouseDown={e => { e.stopPropagation(); onClose(); }}
      />
      <div
        className={styles.popup}
        style={{ left: x, top: y }}
        onMouseDown={e => e.stopPropagation()}
      >
      <div className={styles.popupHeader}>
        <span className={styles.popupTitle}>Connection</span>
        {/* Regular close — no delete */}
        <button className={styles.popupClose} onClick={onClose} title="Close">✕</button>
      </div>

        <div className={styles.popupRoute}>
          <span className={styles.popupDevice}>{from?.label ?? '?'}</span>
          <span className={styles.popupArrow}>───</span>
          <span className={styles.popupDevice}>{to?.label ?? '?'}</span>
        </div>

        <div className={styles.popupFields}>
          {/* <label className={styles.popupLabel}>Port Mode</label>
          <select
            className={styles.popupSelect}
            value={conn.config.portMode}
            onChange={e => update({ portMode: e.target.value as PortMode })}
          >
            <option value="access">Access (single VLAN)</option>
            <option value="trunk">Trunk (multiple VLANs)</option>
          </select>

          {showVlan && (
            <>
              <label className={styles.popupLabel}>VLAN ID</label>
              <input
                className={styles.popupInput}
                type="number" min={1} max={4094}
                placeholder="1–4094 (default: 1)"
                value={conn.config.vlanId ?? ''}
                onChange={e => update({ vlanId: Number(e.target.value) || undefined })}
              />
            </>
          )} */}

          {showIp && (
            <>
              <label className={styles.popupLabel}>IP — {from?.label} side</label>
              <input
                className={styles.popupInput}
                type="text" placeholder="e.g. 10.0.0.1/30"
                value={conn.config.ipA ?? ''}
                onChange={e => update({ ipA: e.target.value })}
              />
              <label className={styles.popupLabel}>IP — {to?.label} side</label>
              <input
                className={styles.popupInput}
                type="text" placeholder="e.g. 10.0.0.2/30"
                value={conn.config.ipB ?? ''}
                onChange={e => update({ ipB: e.target.value })}
              />
            </>
          )}

          <label className={styles.popupLabel}>Label (optional)</label>
          <input
            className={styles.popupInput}
            type="text" placeholder="e.g. uplink, mgmt"
            value={conn.config.description ?? ''}
            onChange={e => update({ description: e.target.value })}
          />
        </div>

        <div className={styles.popupActions}>
          <button className={styles.popupSave} onClick={onClose}>Done</button>
          <button className={styles.popupDeleteBtn} onClick={handleDelete}>Delete</button>
        </div>
      </div>
    </>
  );
};
