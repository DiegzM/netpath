import React from 'react';
import { useSimStore } from '../../store/useSimStore';
import { getCurrentHopAction } from '../../engine/simulation';
import styles from './NetworkCanvas.module.css';

// Animated packet dot that travels along the simulation path.
// Reads from useSimStore only — no canvas store dependency.
export const SimPacket: React.FC = () => {
  const simState = useSimStore(s => s.simState);
  if (!simState) return null;

  const tooltip = getCurrentHopAction(simState);

  return (
    <div
      className={`${styles.packet} ${simState.done ? styles.packetBurst : ''}`}
      style={{
        left: simState.x - 8,
        top:  simState.y - 8,
        transition: 'left 0.45s ease-in-out, top 0.45s ease-in-out',
      }}
      title={tooltip}
    />
  );
};
