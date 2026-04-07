import type { Device }     from './device';
import type { Connection } from './connection';

export type ValidationStatus = 'idle' | 'valid' | 'invalid' | 'partial';

export interface StageConfig {
  id:                 number;
  title:              string;
  subtitle:           string;
  arc:                1 | 2;
  theory:             string[];
  task:               string;
  hint:               string;
  requiredConnections: number;
  requiredDevices:    number;
  preplacedDevices:   Device[];
  targetDeviceKinds:  import('./device').DeviceKind[];
  validateFn:         (devices: Device[], connections: Connection[]) => ValidationStatus;
}
