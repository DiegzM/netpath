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

  const setGhostAtPointer = useCallback((point: { clientX: number; clientY: number }) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (rect) setGhostEnd({ x: point.clientX - rect.left, y: point.clientY - rect.top });
  }, [canvasRef]);

  const completeWire = useCallback((toId: string) => {
    const df = useCanvasStore.getState().drawingFrom;
    if (!df || df === toId) return;

    const newConnId = finishDrawing(toId);

    // Deselect the source node, select the new connection instead
    useCanvasStore.getState().selectDevice(null);

    // Return the connId so NetworkCanvas can set selectedConnId
    return newConnId ?? undefined;
  }, [finishDrawing]);

  return {
    ghostEnd,
    completeWire,
    setGhostAtPointer,
  };
}
