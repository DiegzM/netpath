import type { Device } from '../types/device';
import type { Connection } from '../types/connection';

const W = 280;
const H = 180;
const NODE_R = 10;
const PADDING = 24;

const KIND_COLORS: Record<string, string> = {
  pc:       '#4fd1c5',
  server:   '#68d391',
  switch:   '#f6ad55',
  router:   '#fc8181',
  internet: '#a78bfa',
};

export function generateWorldThumbnail(devices: Device[], connections: Connection[]): string {
  if (devices.length === 0) {
    // Empty state thumbnail
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
      <rect width="${W}" height="${H}" fill="#0d1f35"/>
      <text x="${W / 2}" y="${H / 2}" text-anchor="middle" dominant-baseline="middle"
        font-family="monospace" font-size="11" fill="#2d4a6a">empty canvas</text>
    </svg>`;
    return `data:image/svg+xml;base64,${btoa(svg)}`;
  }

  // Normalize positions to fit inside W×H with padding
  const xs = devices.map((d) => d.x);
  const ys = devices.map((d) => d.y);
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);
  const rangeX = maxX - minX || 1;
  const rangeY = maxY - minY || 1;

  function tx(x: number) {
    return PADDING + ((x - minX) / rangeX) * (W - PADDING * 2);
  }
  function ty(y: number) {
    return PADDING + ((y - minY) / rangeY) * (H - PADDING * 2);
  }

  const lines = connections
    .map((conn) => {
      const a = devices.find((d) => d.id === conn.from);
      const b = devices.find((d) => d.id === conn.to);
      if (!a || !b) return '';
      return `<line x1="${tx(a.x).toFixed(1)}" y1="${ty(a.y).toFixed(1)}" x2="${tx(b.x).toFixed(1)}" y2="${ty(b.y).toFixed(1)}" stroke="#1e3a5a" stroke-width="1.5"/>`;
    })
    .join('');

  const circles = devices
    .map((d) => {
      const color = KIND_COLORS[d.kind] ?? '#4fd1c5';
      const x = tx(d.x).toFixed(1);
      const y = ty(d.y).toFixed(1);
      return `<circle cx="${x}" cy="${y}" r="${NODE_R}" fill="${color}" fill-opacity="0.85"/>`;
    })
    .join('');

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
    <rect width="${W}" height="${H}" fill="#0d1f35"/>
    ${lines}
    ${circles}
  </svg>`;

  return `data:image/svg+xml;base64,${btoa(svg)}`;
}
