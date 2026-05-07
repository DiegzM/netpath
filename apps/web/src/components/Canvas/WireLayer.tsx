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
  const devices     = useCanvasStore(s => s.devices);
  const connections = useCanvasStore(s => s.connections);
  const fromDevice  = drawingFromId ? devices.find(d => d.id === drawingFromId) : null;

  const busyLinkIds = new Set<string>();
  for (const p of packets) {
    const fromId = p.path[p.pathIndex];
    const toId = p.path[p.pathIndex + 1];
    if (!fromId || !toId) continue;

    const conn = connections.find(
      c => (c.from === fromId && c.to === toId) || (c.from === toId && c.to === fromId),
    );
    if (conn) busyLinkIds.add(conn.id);
  }

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
        const pressure   = linkPressure[conn.id] ?? 0;
        const isSaturated = pressure >= 1;
        const isBusy      = busyLinkIds.has(conn.id);
        const isWireless  = conn.config.linkType === 'wireless';
        const mx          = (pa.x + pb.x) / 2;
        const my          = (pa.y + pb.y) / 2;

        const wireColor = isSelected ? '#f6ad55' : isSaturated ? '#fc5c5c' : isBusy ? '#68d391' : '#4fd1c5';
        const wireOpacity = isSelected ? 1 : isSaturated ? 0.95 : isBusy ? 0.85 : 0.65;
        const dashArray = isWireless ? '5 8' : isSelected ? undefined : '7 4';
        const label = conn.config.description ?? null;

        return (
          <g key={conn.id}>
            <line
              x1={pa.x} y1={pa.y} x2={pb.x} y2={pb.y}
              stroke={wireColor}
              strokeWidth="4" opacity={isSaturated ? 0.35 : 0.12} filter="url(#glow)"
            />

            <line
              x1={pa.x} y1={pa.y} x2={pb.x} y2={pb.y}
              stroke={wireColor}
              strokeWidth={isSelected ? 2 : isSaturated ? 2 : 1.5}
              strokeDasharray={dashArray}
              opacity={wireOpacity}
              style={isWireless ? { animation: 'wirelessDash 1.2s linear infinite' } : undefined}
            />

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

            {label && (
              <text
                x={mx} y={my - 8}
                textAnchor="middle"
                fill={wireColor}
                fontSize="9" fontFamily="var(--font-mono)"
                opacity="0.8"
                style={{ pointerEvents: 'none' }}
              >
                {label}
              </text>
            )}

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

      {fromDevice && ghostEnd && (
        <line
          x1={fromDevice.x}
          y1={fromDevice.y}
          x2={ghostEnd.x}
          y2={ghostEnd.y}
          stroke="#f6ad55"
          strokeWidth="1.6"
          strokeDasharray="5 6"
          opacity="0.85"
        />
      )}

      {packets.map((packet) => {
        const fromId = packet.path[packet.pathIndex];
        const toId   = packet.path[packet.pathIndex + 1];
        if (!fromId || !toId) return null;
        const a = devices.find(d => d.id === fromId);
        const b = devices.find(d => d.id === toId);
        if (!a || !b) return null;
        const pa = edgePoint(a, b.x, b.y);
        const pb = edgePoint(b, a.x, a.y);
        const cx = pa.x + (pb.x - pa.x) * packet.progress;
        const cy = pa.y + (pb.y - pa.y) * packet.progress;
        const isSingle = packet.id.startsWith('single-');
        return (
          <circle
            key={packet.id}
            cx={cx}
            cy={cy}
            r={isSingle ? 5 : 4}
            fill={isSingle ? '#f6e05e' : '#4fd1c5'}
            filter="url(#glow)"
            opacity="0.95"
          />
        );
      })}
    </svg>
  );
};