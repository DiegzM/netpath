import React from 'react';
import type { DeviceKind } from '../../types/device';

const PcIcon = () => (
  <g>
    <rect x="4" y="6" width="24" height="18" rx="2" fill="#0d1117" stroke="currentColor" strokeWidth="1.5"/>
    <rect x="11" y="24" width="10" height="3" fill="currentColor" opacity="0.6"/>
    <rect x="8" y="27" width="16" height="1.5" rx="0.75" fill="currentColor" opacity="0.4"/>
    <rect x="7" y="9" width="18" height="12" rx="1" fill="#1a2332" stroke="currentColor" strokeWidth="0.5" opacity="0.8"/>
    <circle cx="16" cy="15" r="3" fill="currentColor" opacity="0.3"/>
  </g>
);

const ServerIcon = () => (
  <g>
    <rect x="6" y="5" width="20" height="22" rx="2" fill="#0d1117" stroke="currentColor" strokeWidth="1.5"/>
    {[8, 12, 16, 20].map((y, i) => (
      <g key={i}>
        <rect x="8" y={y} width="16" height="3" rx="0.5" fill="none" stroke="currentColor" strokeWidth="0.8" opacity="0.6"/>
        <circle cx="22" cy={y + 1.5} r="1" fill="currentColor" opacity={i % 2 === 0 ? 0.9 : 0.4}/>
        <rect x="9" y={y + 0.5} width="7" height="2" rx="0.5" fill="currentColor" opacity="0.25"/>
      </g>
    ))}
  </g>
);

const SwitchIcon = () => (
  <g>
    <rect x="2" y="10" width="28" height="12" rx="3" fill="#0d1117" stroke="currentColor" strokeWidth="1.5"/>
    {[6, 10, 14, 18, 22, 26].map((x, i) => (
      <g key={i}>
        <rect x={x - 1.5} y="14" width="3" height="4" rx="0.5" fill="currentColor" opacity="0.7"/>
        <circle cx={x} cy="13" r="1" fill="currentColor" opacity={i % 2 === 0 ? 0.9 : 0.3}/>
      </g>
    ))}
  </g>
);

const RouterIcon = () => (
  <g>
    <circle cx="16" cy="16" r="12" fill="#0d1117" stroke="currentColor" strokeWidth="1.5"/>
    <circle cx="16" cy="16" r="6" fill="none" stroke="currentColor" strokeWidth="1" opacity="0.5"/>
    <circle cx="16" cy="16" r="2.5" fill="currentColor" opacity="0.8"/>
    {[0, 72, 144, 216, 288].map((deg, i) => {
      const rad = (deg * Math.PI) / 180;
      return <line key={i}
        x1={16 + 6 * Math.cos(rad)} y1={16 + 6 * Math.sin(rad)}
        x2={16 + 11 * Math.cos(rad)} y2={16 + 11 * Math.sin(rad)}
        stroke="currentColor" strokeWidth="1" opacity="0.6"/>;
    })}
  </g>
);

const InternetIcon = () => (
  <g>
    <circle cx="16" cy="16" r="11" fill="#0d1117" stroke="currentColor" strokeWidth="1.5"/>
    <ellipse cx="16" cy="16" rx="5" ry="11" fill="none" stroke="currentColor" strokeWidth="1" opacity="0.5"/>
    <line x1="5"  y1="16" x2="27" y2="16" stroke="currentColor" strokeWidth="1" opacity="0.5"/>
    <line x1="7"  y1="10" x2="25" y2="10" stroke="currentColor" strokeWidth="1" opacity="0.35"/>
    <line x1="7"  y1="22" x2="25" y2="22" stroke="currentColor" strokeWidth="1" opacity="0.35"/>
  </g>
);

const ICONS: Record<DeviceKind, React.FC> = {
  'pc':          PcIcon,
  'server':      ServerIcon,
  'switch':      SwitchIcon,
  'router':      RouterIcon,
  'internet':    InternetIcon,
};

interface DeviceIconProps {
  kind:   DeviceKind;
  size?:  number;
  color?: string;
}

export const DeviceIcon: React.FC<DeviceIconProps> = ({ kind, size = 32, color = '#4fd1c5' }) => {
  const Icon = ICONS[kind];
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" color={color}>
      <Icon />
    </svg>
  );
};
