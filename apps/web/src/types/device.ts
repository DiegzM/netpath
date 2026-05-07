// ─── Device kinds ──────────────────────────────────────────────────────────────

export type DeviceKind =
  | 'pc'
  | 'server'
  | 'switch'
  | 'router'
  | 'internet';

export interface TrafficRule {
  id: string;
  destinationId: string;
  packetsPerSecond: number;
}

// Per-device configuration — what you'd set in a real device's admin panel
export interface DeviceConfig {
  ip?: string; // e.g. "192.168.1.1"
  trafficRules?: TrafficRule[];
}

// A device on the canvas
export interface Device {
  id:     string;
  kind:   DeviceKind;
  label:  string;
  x:      number;
  y:      number;
  config: DeviceConfig;
}
