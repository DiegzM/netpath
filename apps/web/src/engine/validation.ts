import type { Device, DeviceKind } from '../types/device';
import type { Connection }        from '../types/connection';
import type { StagePathStep, StageStreamConfig, ValidationStatus }  from '../types/curriculum';
import { getNeighbors } from './graph';

// ─── Reusable validation rules ─────────────────────────────────────────────────
// Each rule takes the canvas state and returns a ValidationStatus.
// Stages compose these rules rather than writing ad-hoc logic.

export type ValidationRule = (
  devices: Device[],
  connections: Connection[],
) => ValidationStatus;

export function isConnectionAllowed(kindA: DeviceKind, kindB: DeviceKind, fromId: string, toId: string): boolean {
  return fromId !== toId && !(kindA === 'internet' && kindB === 'internet');
}

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

function hasConnectionBetween(connections: Connection[], idA: string, idB: string): boolean {
  return connections.some(
    c => (c.from === idA && c.to === idB) ||
         (c.from === idB && c.to === idA),
  );
}

function getStepCandidates(devices: Device[], step: StagePathStep): Device[] {
  if ('id' in step) return devices.filter((device) => device.id === step.id);
  return devices.filter((device) => device.kind === step.kind);
}

export function resolveStageStreamPath(
  stream: StageStreamConfig,
  devices: Device[],
  connections: Connection[],
): Device[] | null {
  if (stream.path.length < 2) return null;

  const candidatesByStep = stream.path.map((step) => getStepCandidates(devices, step));
  if (candidatesByStep.some((candidates) => candidates.length === 0)) return null;

  function walk(index: number, path: Device[]): Device[] | null {
    if (index === candidatesByStep.length) return path;

    const previous = path[path.length - 1];
    for (const candidate of candidatesByStep[index]) {
      if (path.some((device) => device.id === candidate.id)) continue;
      if (previous && !hasConnectionBetween(connections, previous.id, candidate.id)) continue;

      const result = walk(index + 1, [...path, candidate]);
      if (result) return result;
    }

    return null;
  }

  return walk(0, []);
}

export function validateStageStream(
  stream: StageStreamConfig,
  devices: Device[],
  connections: Connection[],
): ValidationStatus {
  if (resolveStageStreamPath(stream, devices, connections)) return 'valid';

  const hasAnyRequiredDevice = stream.path.some((step) => getStepCandidates(devices, step).length > 0);
  return hasAnyRequiredDevice ? 'partial' : 'idle';
}

// A specific device id is connected to another specific device id
export function requireConnectionById(idA: string, idB: string): ValidationRule {
  return (devices, connections) => {
    const aExists = devices.some(d => d.id === idA);
    const bExists = devices.some(d => d.id === idB);
    if (!aExists || !bExists) return 'idle';
    return hasConnectionBetween(connections, idA, idB) ? 'valid' : 'partial';
  };
}

// All listed device id pairs are connected
export function requireConnectionsById(pairs: Array<[string, string]>): ValidationRule {
  return (devices, connections) => {
    const deviceIds = new Set(devices.map(d => d.id));
    const availablePairs = pairs.filter(([idA, idB]) => deviceIds.has(idA) && deviceIds.has(idB));
    if (availablePairs.length === 0) return 'idle';

    const linkedCount = availablePairs.filter(
      ([idA, idB]) => hasConnectionBetween(connections, idA, idB),
    ).length;

    if (linkedCount === pairs.length) return 'valid';
    if (linkedCount > 0) return 'partial';
    return 'idle';
  };
}

// ─── Compose multiple rules — first non-valid wins ────────────────────────────

export function combineValidationStatuses(results: ValidationStatus[]): ValidationStatus {
  if (results.includes('invalid')) return 'invalid';
  if (results.every((result) => result === 'valid')) return 'valid';
  if (results.includes('partial')) return 'partial';
  if (results.includes('valid')) return 'partial';
  return 'idle';
}

export function composeRules(...rules: ValidationRule[]): ValidationRule {
  return (devices, connections) => {
    const results = rules.map((rule) => rule(devices, connections));
    return combineValidationStatuses(results);
  };
}
