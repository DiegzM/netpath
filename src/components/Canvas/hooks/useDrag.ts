import { useCallback } from 'react';
import { useCanvasStore } from '../../../store/useCanvasStore';

const DRAG_THRESHOLD = 6;

export function useDrag(
  deviceId: string,
  onClick?: () => void,
): (e: React.MouseEvent) => void {
  return useCallback((e: React.MouseEvent) => {
    if (e.button !== 0) return;

    const store = useCanvasStore.getState();
    const dev   = store.devices.find(d => d.id === deviceId);
    if (!dev) return;

    const isMulti = store.selectedIds.size > 1 && store.selectedIds.has(deviceId);
    const startX  = e.clientX, startY = e.clientY;
    let   dragged = false;

    // Snapshot original positions of everything that will move
    const origPositions = new Map<string, { x: number; y: number }>();
    if (isMulti) {
      store.devices.forEach(d => {
        if (store.selectedIds.has(d.id)) origPositions.set(d.id, { x: d.x, y: d.y });
      });
    } else {
      origPositions.set(deviceId, { x: dev.x, y: dev.y });
    }

    const onMove = (me: MouseEvent) => {
      if (!dragged && Math.hypot(me.clientX - startX, me.clientY - startY) > DRAG_THRESHOLD)
        dragged = true;

      if (dragged) {
        const dx = me.clientX - startX;
        const dy = me.clientY - startY;
        origPositions.forEach((orig, id) => {
          useCanvasStore.getState().moveDevice(id, orig.x + dx, orig.y + dy);
        });
      }
    };

    const onUp = () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup',   onUp);
      if (!dragged && onClick) onClick();
    };

    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup',   onUp);
  }, [deviceId, onClick]);
}