// ─── Link types ────────────────────────────────────────────────────────────────

export type LinkType = 'ethernet' | 'fast-ethernet' | 'fiber' | 'wifi' | 'trunk';
export type PortMode = 'access' | 'trunk';

// All configuration that lives on a connection between two devices
export interface ConnectionConfig {
  linkType:    LinkType;
  portMode:    PortMode;
  vlanId?:     number;   // 1–4094, relevant when portMode = 'access'
  ipA?:        string;   // IP on the from-device side (routed links)
  ipB?:        string;   // IP on the to-device side (routed links)
  description?: string;  // free-text label shown on the wire
}

// A connection between two devices on the canvas
export interface Connection {
  id:     string;
  from:   string;        // device id
  to:     string;        // device id
  config: ConnectionConfig;
}

// Default config applied when a new connection is created
export const DEFAULT_CONNECTION_CONFIG: ConnectionConfig = {
  linkType: 'ethernet',
  portMode: 'access',
};
