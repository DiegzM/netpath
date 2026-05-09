import type { Device }     from './device';
import type { DeviceKind } from './device';
import type { Connection } from './connection';

export type ValidationStatus = 'idle' | 'valid' | 'invalid' | 'partial';

export type StagePathStep =
  | { id: string }
  | { kind: DeviceKind };

export interface StageStreamConfig {
  path: StagePathStep[];
}

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
  targetDeviceKinds:  DeviceKind[];
  stream?:            StageStreamConfig;
  validateFn:         (devices: Device[], connections: Connection[]) => ValidationStatus;
}
