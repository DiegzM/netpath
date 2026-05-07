import React from 'react';
import { useCanvasStore } from '../../store/useCanvasStore';
import type { Device }    from '../../types/device';
import type { LinkPressureMap, SimPacket } from './hooks/usePacketSimulation';
import styles from './NetworkCanvas.module.css';

const CIRCLE_R = 31;

function edgePoint(d: Device, tx: number, ty: number) {
  const angle = Math.atan2(ty - d.y, tx - d.x);
  return { x: d.x + CIRCLE_R * Math.cos(angle), y: d.y + CIRCLE_R * Math.sin(angle) };
}

interface WireLayerProps {
  ghostEnd:       { x: number; y: number } | null;
  drawingFromId:  string | null;
  selectedConnId: string | null;
  packets:        SimPacket[];
  linkPressure:   LinkPressureMap;
  onConnClick:    (connId: string, x: number, y: number) => void;
}

export const WireLayer: React.FC<WireLayerProps> = ({
  ghostEnd, drawingFromId, selectedConnId, packets, linkPressure, onConnClick,
}) => {
  const devices          = useCanvasStore(s => s.devices);
  const connections      = useCanvasStore(s => s.connections);
  const fromDevice       = drawingFromId ? devices.find(d => d.id === drawingFromId) : null;

  return (
    <svg className={styles.svg} style={{ pointerEvents: 'none' }}>
      <defs>
        <filter id="glow">
          <feGaussianBlur stdDeviation="2.5" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {connections.map(conn => {
        const a = devices.find(d => d.id === conn.from);
        const b = devices.find(d => d.id === conn.to);
        if (!a || !b) return null;

        const pa         = edgePoint(a, b.x, b.y);
        const pb         = edgePoint(b, a.x, a.y);
        const isSelected  = selectedConnId === conn.id;
        const mx          = (pa.x + pb.x) / 2;
        const my          = (pa.y + pb.y) / 2;
        const pressure    = linkPressure[conn.id] ?? 0;

        const wireColor = isSelected
          ? '#f6ad55'
          : pressure >= 1
            ? '#e53e3e'
            : pressure >= 0.7
              ? '#4fd1c5'
              : '#4fd1c5';

        const wireOpacity = isSelected ? 1 : pressure >= 1 ? 0.95 : pressure >= 0.7 ? 0.82 : 0.55;
        const strokeWidth = pressure >= 1 ? 3 : pressure >= 0.7 ? 2.2 : isSelected ? 2.4 : 1.5;

        return (
          <g key={conn.id}>
            {/* Glow layer */}
            <line
              x1={pa.x} y1={pa.y} x2={pb.x} y2={pb.y}
              stroke={wireColor}
              strokeWidth={pressure >= 1 ? 8 : 4}
              opacity={pressure >= 1 ? 0.26 : 0.12}
              filter="url(#glow)"
            />

            {/* Visible cable */}
            <line
              x1={pa.x} y1={pa.y} x2={pb.x} y2={pb.y}
              stroke={wireColor}
              strokeWidth={strokeWidth}
              strokeDasharray={isSelected ? undefined : '7 4'}
              opacity={wireOpacity}
            />

            {/* Fat invisible hit target */}
            <line
              x1={pa.x} y1={pa.y} x2={pb.x} y2={pb.y}
              stroke="transparent"
              strokeWidth="14"
              style={{ pointerEvents: 'stroke', cursor: 'pointer' }}
              onClick={e => {
                e.stopPropagation();
              }}
              onContextMenu={e => {
                e.preventDefault();
                e.stopPropagation();
                onConnClick(conn.id, mx, my);
              }}
            />

            {/* Selection dot at midpoint */}
            {isSelected && (
              <circle
                cx={mx} cy={my} r="5"
                fill="#f6ad55"
                style={{ pointerEvents: 'none' }}
              />
            )}
          </g>
        );
      })}

      {packets.map((packet) => {
        if (packet.pathIndex >= packet.path.length - 1) return null;

        const from = devices.find((device) => device.id === packet.path[packet.pathIndex]);
        const to = devices.find((device) => device.id === packet.path[packet.pathIndex + 1]);
        if (!from || !to) return null;

        const start = edgePoint(from, to.x, to.y);
        const end = edgePoint(to, from.x, from.y);
        const x = start.x + (end.x - start.x) * packet.progress;
        const y = start.y + (end.y - start.y) * packet.progress;

        return (
          <circle
            key={packet.id}
            cx={x}
            cy={y}
            r="3.5"
            fill="#e6fffb"
            stroke="#4fd1c5"
            strokeWidth="1"
            opacity="0.95"
            style={{ pointerEvents: 'none' }}
          />
        );
      })}

      {fromDevice && ghostEnd && (() => {
        const start = edgePoint(fromDevice, ghostEnd.x, ghostEnd.y);

        return (
          <g>
            <line
              x1={start.x} y1={start.y} x2={ghostEnd.x} y2={ghostEnd.y}
              stroke="#f6ad55"
              strokeWidth="5"
              opacity="0.14"
              filter="url(#glow)"
            />
            <line
              x1={start.x} y1={start.y} x2={ghostEnd.x} y2={ghostEnd.y}
              stroke="#f6ad55"
              strokeWidth="2"
              strokeDasharray="7 5"
              opacity="0.9"
            />
            <circle
              cx={ghostEnd.x}
              cy={ghostEnd.y}
              r="4"
              fill="#f6ad55"
              opacity="0.95"
            />
          </g>
        );
      })()}
    </svg>
  );
};
