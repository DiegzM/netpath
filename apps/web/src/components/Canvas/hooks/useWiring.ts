import { useEffect, useState, useCallback } from 'react';
import { useCanvasStore } from '../../../store/useCanvasStore';

export function useWiring(canvasRef: React.RefObject<HTMLDivElement>) {
  const { finishDrawing, cancelDrawing, drawingFrom } = useCanvasStore();
  const [ghostEnd, setGhostEnd] = useState<{ x: number; y: number } | null>(null);

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
    const all = useCanvasStore.getState();
    const newConn = all.connections.find(
      c => (c.from === df && c.to === toId) ||
           (c.from === toId && c.to === df)
    );

    // Deselect the source node, select the new connection instead
    all.selectDevice(null);

    // Return the connId so NetworkCanvas can set selectedConnId
    return newConn?.id;
  }, [finishDrawing]);

  return {
    ghostEnd,
    completeWire,
  };
}
