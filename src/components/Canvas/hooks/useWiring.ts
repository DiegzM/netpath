import { useEffect, useState, useCallback } from 'react';
import { useCanvasStore } from '../../../store/useCanvasStore';

interface PopupState {
  fromId: string;
  toId:   string;
  x:      number;
  y:      number;
}

const CIRCLE_R = 31;

function edgePoint(dx: number, dy: number, tx: number, ty: number) {
  const angle = Math.atan2(ty - dy, tx - dx);
  return { x: dx + CIRCLE_R * Math.cos(angle), y: dy + CIRCLE_R * Math.sin(angle) };
}

export function useWiring(canvasRef: React.RefObject<HTMLDivElement>) {
  const { startDrawing, finishDrawing, cancelDrawing, drawingFrom } = useCanvasStore();
  const [ghostEnd, setGhostEnd] = useState<{ x: number; y: number } | null>(null);
  const [popup, setPopup]       = useState<PopupState | null>(null);

  // Track mouse for ghost wire
  useEffect(() => {
    if (!drawingFrom) { setGhostEnd(null); return; }
    const h = (e: MouseEvent) => {
      const rect = canvasRef.current?.getBoundingClientRect();
      if (rect) setGhostEnd({ x: e.clientX - rect.left, y: e.clientY - rect.top });
    };
    window.addEventListener('mousemove', h);
    return () => window.removeEventListener('mousemove', h);
  }, [drawingFrom, canvasRef]);

  // Escape cancels wire
  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === 'Escape') cancelDrawing(); };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [cancelDrawing]);

  const completeWire = useCallback((toId: string) => {
    const df = useCanvasStore.getState().drawingFrom;
    if (!df || df === toId) return;

    finishDrawing(toId);

    // Find the connection that was just created
    const all     = useCanvasStore.getState();
    const fromDev = all.devices.find(d => d.id === df);
    const toDev   = all.devices.find(d => d.id === toId);
    if (!fromDev || !toDev) return;

    const newConn = all.connections.find(
      c => (c.from === df && c.to === toId) ||
           (c.from === toId && c.to === df)
    );

    // Deselect the source node, select the new connection instead
    all.selectDevice(null);
    // We surface the connId via popup so NetworkCanvas can set selectedConnId
    const pa = edgePoint(fromDev.x, fromDev.y, toDev.x, toDev.y);
    const pb = edgePoint(toDev.x, toDev.y, fromDev.x, fromDev.y);
    setPopup({
      fromId: df,
      toId,
      x: (pa.x + pb.x) / 2,
      y: (pa.y + pb.y) / 2,
    });

    // Return the connId so NetworkCanvas can set selectedConnId
    return newConn?.id;
  }, [finishDrawing]);

  return {
    ghostEnd,
    popup,
    closePopup: () => setPopup(null),
    completeWire,
  };
}