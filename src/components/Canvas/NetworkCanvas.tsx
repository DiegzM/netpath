import React, { useRef, useCallback, useState, useEffect } from 'react';
import { useCanvasStore }  from '../../store/useCanvasStore';
import { WireLayer }       from './WireLayer';
import { DeviceNode }      from './DeviceNode';
import { SimPacket }       from './SimPacket';
import { ConnectionPopup } from './ConnectionPopup';
import { useWiring }       from './hooks/useWiring';
import type { DeviceKind } from '../../types/device';
import styles from './NetworkCanvas.module.css';

const LABEL_MAP: Record<DeviceKind, string> = {
  host: 'Host', switch: 'Switch', router: 'Router',
  'access-point': 'AP', 'dns-server': 'DNS',
  firewall: 'Firewall', internet: 'Internet',
};

const CIRCLE_R = 31;

export const NetworkCanvas: React.FC = () => {
  const {
    devices, addDevice, startDrawing, cancelDrawing,
    selectDevice, drawingFrom, selectedIds, setSelectedIds,
    clearSelection, removeSelected, undo, redo, past, future,
  } = useCanvasStore();

  const canvasRef = useRef<HTMLDivElement>(null);
  const { ghostEnd, popup, closePopup, completeWire } = useWiring(canvasRef);

  const [selectedConnId, setSelectedConnId] = useState<string | null>(null);
  const [connPopup, setConnPopup] = useState<{ connId: string; x: number; y: number } | null>(null);
  const [marquee, setMarquee]     = useState<{ x: number; y: number; w: number; h: number } | null>(null);

  // ── Global keyboard shortcuts ─────────────────────────────────────────────
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const meta    = e.metaKey || e.ctrlKey;
      const inInput = ['INPUT','SELECT','TEXTAREA'].includes((e.target as HTMLElement).tagName);

      if (meta && !e.shiftKey && e.key === 'z') { e.preventDefault(); undo(); return; }
      if ((meta && e.shiftKey && e.key === 'z') || (meta && e.key === 'y')) { e.preventDefault(); redo(); return; }
      if (!inInput && (e.key === 'Delete' || e.key === 'Backspace')) removeSelected();
      if (e.key === 'Escape') { cancelDrawing(); clearSelection(); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [undo, redo, removeSelected, cancelDrawing, clearSelection]);

  // ── Node click ────────────────────────────────────────────────────────────
  const handleNodeClick = useCallback((deviceId: string) => {
    const df = useCanvasStore.getState().drawingFrom;
    setSelectedConnId(null);
    if (df && df !== deviceId) {
      const newConnId = completeWire(deviceId);
      // Select the new connection, deselect the node
      if (newConnId) {
        setSelectedConnId(newConnId);
        selectDevice(null);
      }
    } else {
      startDrawing(deviceId);
      selectDevice(deviceId);
    }
  }, [completeWire, startDrawing, selectDevice]);

  // ── Connection click ──────────────────────────────────────────────────────
  const handleConnClick = useCallback((connId: string, x: number, y: number) => {
    if (useCanvasStore.getState().drawingFrom) return;
    setSelectedConnId(connId);
    setConnPopup({ connId, x, y });
    selectDevice(null);
  }, [selectDevice]);

  // ── Canvas mousedown — marquee start or cancel ────────────────────────────
  function handleCanvasMouseDown(e: React.MouseEvent) {
    if (e.button !== 0) return;

    cancelDrawing();
    selectDevice(null);
    setSelectedConnId(null);
    setConnPopup(null);

    const rect  = canvasRef.current!.getBoundingClientRect();
    const sx    = e.clientX - rect.left;
    const sy    = e.clientY - rect.top;
    let   moved = false;

    const onMove = (me: MouseEvent) => {
      moved       = true;
      const cx    = me.clientX - rect.left;
      const cy    = me.clientY - rect.top;
      setMarquee({
        x: Math.min(sx, cx), y: Math.min(sy, cy),
        w: Math.abs(cx - sx), h: Math.abs(cy - sy),
      });
    };

    const onUp = () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup',   onUp);

      if (!moved) { setMarquee(null); return; }

      setMarquee(prev => {
        if (!prev || (prev.w < 5 && prev.h < 5)) return null;
        const inBox = new Set<string>();
        useCanvasStore.getState().devices.forEach(d => {
          if (
            d.x + CIRCLE_R >= prev.x && d.x - CIRCLE_R <= prev.x + prev.w &&
            d.y + CIRCLE_R >= prev.y && d.y - CIRCLE_R <= prev.y + prev.h
          ) inBox.add(d.id);
        });
        if (inBox.size > 0) setSelectedIds(inBox);
        return null;
      });
    };

    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup',   onUp);
  }

  // ── Drop from palette ─────────────────────────────────────────────────────
  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    const kind = e.dataTransfer.getData('deviceKind') as DeviceKind;
    if (!kind) return;
    const rect = canvasRef.current!.getBoundingClientRect();
    addDevice({
      id: `d-${Date.now()}`, kind, label: LABEL_MAP[kind],
      x: e.clientX - rect.left, y: e.clientY - rect.top,
      config: {},
    });
  }

  return (
    <div
      ref={canvasRef}
      className={`${styles.canvas} ${drawingFrom ? styles.canvasDrawing : ''}`}
      onMouseDown={handleCanvasMouseDown}
      onDrop={handleDrop}
      onDragOver={e => e.preventDefault()}
    >
      <div className={styles.grid} />

      {/* Undo / Redo */}
      <div className={styles.undoRedo} onMouseDown={e => e.stopPropagation()}>
        <button className={styles.histBtn} disabled={!past.length}   onClick={undo} title="Undo (⌘Z)">↩</button>
        <button className={styles.histBtn} disabled={!future.length} onClick={redo} title="Redo (⌘⇧Z)">↪</button>
      </div>

      <WireLayer
        ghostEnd={ghostEnd}
        drawingFromId={drawingFrom}
        selectedConnId={selectedConnId}
        onConnClick={handleConnClick}
      />

      {devices.map(d => (
        <DeviceNode
          key={d.id} device={d}
          isDrawSource={drawingFrom === d.id}
          isWiring={drawingFrom !== null}
          onNodeClick={handleNodeClick}
        />
      ))}

      <SimPacket />

      {/* Marquee */}
      {marquee && marquee.w > 4 && marquee.h > 4 && (
        <div
          className={styles.marquee}
          style={{ left: marquee.x, top: marquee.y, width: marquee.w, height: marquee.h }}
        />
      )}

      {popup && (
        <ConnectionPopup
          fromId={popup.fromId} toId={popup.toId}
          x={popup.x} y={popup.y}
          onClose={closePopup}
        />
      )}

      {connPopup && !popup && (
        <ConnectionPopup
          connId={connPopup.connId}
          x={connPopup.x} y={connPopup.y}
          onClose={() => { setConnPopup(null); setSelectedConnId(null); }}
        />
      )}

      {devices.length === 0 && (
        <p className={styles.empty}>Drop devices here to start building</p>
      )}
    </div>
  );
};