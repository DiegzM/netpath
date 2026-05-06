// ─── Device kinds ──────────────────────────────────────────────────────────────

export type DeviceKind =
  | 'host'
  | 'switch'
  | 'router'
  | 'access-point'
  | 'dns-server'
  | 'firewall'
  | 'internet';

// Per-device configuration — what you'd set in a real device's admin panel
export interface DeviceConfig {
  ip?:              string;   // e.g. "192.168.1.1"
  subnet?:          string;   // e.g. "255.255.255.0"
  gateway?:         string;   // default gateway IP
  dhcpEnabled?:     boolean;
  vlanMemberships?: number[]; // VLANs this device belongs to
  macAddress?:      string;   // auto-generated or user-set
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
