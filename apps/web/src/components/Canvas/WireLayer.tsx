import React from 'react';
import { useCanvasStore } from '../../store/useCanvasStore';
import type { Device }    from '../../types/device';
import styles from './NetworkCanvas.module.css';

const CIRCLE_R = 31;

function edgePoint(d: Device, tx: number, ty: number) {
  const angle = Math.atan2(ty - d.y, tx - d.x);
  return { x: d.x + CIRCLE_R * Math.cos(angle), y: d.y + CIRCLE_R * Math.sin(angle) };
}

interface WireLayerProps {
  ghostEnd:      { x: number; y: number } | null;
  drawingFromId: string | null;
  selectedConnId: string | null;
  onConnClick:   (connId: string, x: number, y: number) => void;
}

export const WireLayer: React.FC<WireLayerProps> = ({
  ghostEnd, drawingFromId, selectedConnId, onConnClick,
}) => {
  const devices     = useCanvasStore(s => s.devices);
  const connections = useCanvasStore(s => s.connections);
  const fromDevice  = drawingFromId ? devices.find(d => d.id === drawingFromId) : null;

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
        const isSelected = selectedConnId === conn.id;
        const mx         = (pa.x + pb.x) / 2;
        const my         = (pa.y + pb.y) / 2;

        // Label: description or VLAN
        const label = conn.config.description
          || (conn.config.vlanId ? `VLAN ${conn.config.vlanId}` : null);

        return (
          <g key={conn.id}>
            {/* Glow layer */}
            <line
              x1={pa.x} y1={pa.y} x2={pb.x} y2={pb.y}
              stroke={isSelected ? '#f6ad55' : '#4fd1c5'}
              strokeWidth="4" opacity="0.15" filter="url(#glow)"
            />

            {/* Visible cable */}
            <line
              x1={pa.x} y1={pa.y} x2={pb.x} y2={pb.y}
              stroke={isSelected ? '#f6ad55' : '#4fd1c5'}
              strokeWidth={isSelected ? 2 : 1.5}
              strokeDasharray={isSelected ? 'none' : '7 4'}
              opacity={isSelected ? 1 : 0.7}
            />

            {/* Fat invisible hit target — makes clicking the cable easy */}
            <line
              x1={pa.x} y1={pa.y} x2={pb.x} y2={pb.y}
              stroke="transparent"
              strokeWidth="14"
              style={{ pointerEvents: 'stroke', cursor: 'pointer' }}
              onClick={e => {
                e.stopPropagation();
                onConnClick(conn.id, mx, my);
              }}
            />

            {/* Label at midpoint */}
            {label && (
              <text
                x={mx} y={my - 8}
                textAnchor="middle"
                fill={isSelected ? '#f6ad55' : '#4fd1c5'}
                fontSize="9" fontFamily="var(--font-mono)"
                opacity="0.8"
                style={{ pointerEvents: 'none' }}
              >
                {label}
              </text>
            )}

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

      {/* Ghost wire while drawing */}
      {fromDevice && ghostEnd && (() => {
        const p = edgePoint(fromDevice, ghostEnd.x, ghostEnd.y);
        return (
          <line
            x1={p.x} y1={p.y} x2={ghostEnd.x} y2={ghostEnd.y}
            stroke="#f6ad55" strokeWidth="1.5"
            strokeDasharray="6 4" opacity="0.9"
          />
        );
      })()}
    </svg>
  );
};