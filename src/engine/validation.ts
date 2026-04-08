import type { Device }           from '../types/device';
import type { Connection }        from '../types/connection';
import type { ValidationStatus }  from '../types/curriculum';
import { getNeighbors, hasDeviceKind, getDevicesByKind } from './graph';

// ─── Reusable validation rules ─────────────────────────────────────────────────
// Each rule takes the canvas state and returns a ValidationStatus.
// Stages compose these rules rather than writing ad-hoc logic.

export type ValidationRule = (
  devices: Device[],
  connections: Connection[],
) => ValidationStatus;

// All listed device kinds exist on the canvas
export function requireDeviceKinds(kinds: string[]): ValidationRule {
  return (devices) => {
    const missing = kinds.filter(k => !devices.some(d => d.kind === k));
    if (missing.length === 0) return 'valid';
    if (missing.length < kinds.length) return 'partial';
    return 'idle';
  };
}

// A device of kindA is connected to a device of kindB
export function requireConnection(kindA: string, kindB: string): ValidationRule {
  return (devices, connections) => {
    const a = devices.find(d => d.kind === kindA);
    const b = devices.find(d => d.kind === kindB);
    if (!a || !b) return 'idle';
    const linked = connections.some(
      c => (c.from === a.id && c.to === b.id) ||
           (c.from === b.id && c.to === a.id)
    );
    return linked ? 'valid' : 'partial';
  };
}

// All devices of kindA are connected to a device of kindB
export function requireAllConnectedTo(kindA: string, kindB: string): ValidationRule {
  return (devices, connections) => {
    const targets = devices.filter(d => d.kind === kindA);
    const hub     = devices.find(d => d.kind === kindB);
    if (!hub || targets.length === 0) return 'idle';
    const connected = targets.filter(t =>
      connections.some(
        c => (c.from === t.id && c.to === hub.id) ||
             (c.from === hub.id && c.to === t.id)
      )
    );
    if (connected.length === targets.length) return 'valid';
    if (connected.length > 0) return 'partial';
    return 'idle';
  };
}

// A specific device kind is connected to at least N other devices
export function requireMinConnections(kind: string, minCount: number): ValidationRule {
  return (devices, connections) => {
    const device = devices.find(d => d.kind === kind);
    if (!device) return 'idle';
    const count = getNeighbors(connections, device.id).length;
    if (count >= minCount) return 'valid';
    if (count > 0) return 'partial';
    return 'idle';
  };
}

// ─── Compose multiple rules — first non-valid wins ────────────────────────────

export function composeRules(...rules: ValidationRule[]): ValidationRule {
  return (devices, connections) => {
    const results = rules.map((rule) => rule(devices, connections));

    if (results.includes('invalid')) return 'invalid';
    if (results.every((result) => result === 'valid')) return 'valid';
    if (results.includes('partial')) return 'partial';
    if (results.includes('valid')) return 'partial';
    return 'idle';
  };
}
