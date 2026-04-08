import React from 'react';
import { getCurrentHopAction } from '../../engine/simulation';
import { useSimStore } from '../../store/useSimStore';
import styles from './NetworkCanvas.module.css';

export const SimPacket: React.FC = () => {
  const packets = useSimStore((state) => state.simState.packets);
  if (!packets.length) return null;

  return (
    <>
      {packets.map((packet) => {
        const toneClass =
          packet.message &&
          styles[`packetNote${packet.message.tone[0].toUpperCase()}${packet.message.tone.slice(1)}`];

        return (
          <div key={packet.id}>
            <div
              className={`${styles.packet} ${packet.done ? styles.packetBurst : ''}`}
              style={{
                left: packet.x - 8,
                top: packet.y - 8,
                transition: 'left 0.45s ease-in-out, top 0.45s ease-in-out',
              }}
              title={getCurrentHopAction(packet)}
            />
            {packet.message && (
              <div
                className={`${styles.packetNote} ${toneClass ?? ''}`}
                style={{
                  left: packet.x + 18,
                  top: packet.y - 26,
                  transition: 'left 0.45s ease-in-out, top 0.45s ease-in-out',
                }}
              >
                {packet.message.text}
              </div>
            )}
          </div>
        );
      })}
    </>
  );
};
