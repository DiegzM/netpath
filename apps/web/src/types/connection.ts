// ─── Link settings ─────────────────────────────────────────────────────────────

export type LinkBandwidth = 'low' | 'medium' | 'high';
export type LinkLatency = 'low' | 'medium' | 'high';

// All configuration that lives on a connection between two devices
export interface ConnectionConfig {
  bandwidth: LinkBandwidth;
  latency: LinkLatency;
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
  bandwidth: 'medium',
  latency: 'medium',
};
