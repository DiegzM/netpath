import React, { useEffect } from 'react';
import { useCanvasStore } from '../../store/useCanvasStore';
import type { ConnectionConfig, LinkBandwidth, LinkLatency } from '../../types/connection';
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
          <span className={styles.popupTitle}>Link Inspector</span>
          <button className={styles.popupClose} onClick={onClose} title="Close">✕</button>
        </div>

        <div className={styles.popupRoute}>
          <span className={styles.popupDevice}>{from?.label ?? '?'}</span>
          <span className={styles.popupArrow}>───</span>
          <span className={styles.popupDevice}>{to?.label ?? '?'}</span>
        </div>

        <div className={styles.popupFields}>
          <label className={styles.popupLabel}>Bandwidth</label>
          <select
            className={styles.popupSelect}
            value={conn.config.bandwidth ?? 'medium'}
            onChange={e => update({ bandwidth: e.target.value as LinkBandwidth })}
          >
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
          </select>

          <label className={styles.popupLabel}>Latency</label>
          <select
            className={styles.popupSelect}
            value={conn.config.latency ?? 'medium'}
            onChange={e => update({ latency: e.target.value as LinkLatency })}
          >
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
          </select>
        </div>

        <div className={styles.popupActions}>
          <button className={styles.popupSave} onClick={onClose}>Done</button>
          <button className={styles.popupDeleteBtn} onClick={handleDelete}>Delete</button>
        </div>
      </div>
    </>
  );
};
