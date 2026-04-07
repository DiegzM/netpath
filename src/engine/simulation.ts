import type { Device }     from '../types/device';
import type { Connection } from '../types/connection';
import type { SimState, SimHop } from '../types/simulation';
import { findPath, getConnectionsForDevice } from './graph';

// ─── Hop action descriptions ───────────────────────────────────────────────────
// Explains what each device type does when it receives the packet.

function hopAction(device: Device, prevDevice: Device | undefined, nextDevice: Device | undefined): string {
  switch (device.kind) {
    case 'host':
      if (!prevDevice) return `${device.label} sends HTTP request`;
      return `${device.label} receives response ✓`;
    case 'switch':
      return `Switch checks MAC table → forwards to ${nextDevice?.label ?? 'next hop'}`;
    case 'router':
      return `Router checks routing table → forwards to ${nextDevice?.label ?? 'next hop'}`;
    case 'dns-server':
      return `DNS resolves domain name → returns IP address`;
    case 'firewall':
      return `Firewall inspects packet → rule matched, allow`;
    case 'access-point':
      return `Access point bridges wireless → wired segment`;
    case 'internet':
      return `Packet enters public internet`;
    default:
      return `Forwarding to ${nextDevice?.label ?? 'next hop'}`;
  }
}

// ─── Build simulation ──────────────────────────────────────────────────────────
// Takes a fully validated topology and produces the initial SimState.
// Returns null if no path exists between the given endpoints.

export function buildSimulation(
  devices: Device[],
  connections: Connection[],
  fromId: string,
  toId: string,
): SimState | null {
  const pathIds = findPath(devices, connections, fromId, toId);
  if (!pathIds.length) return null;

  const hops: SimHop[] = pathIds.map((id, i) => {
    const device     = devices.find(d => d.id === id)!;
    const prevDevice = i > 0 ? devices.find(d => d.id === pathIds[i - 1]) : undefined;
    const nextDevice = i < pathIds.length - 1 ? devices.find(d => d.id === pathIds[i + 1]) : undefined;
    return {
      deviceId: id,
      action:   hopAction(device, prevDevice, nextDevice),
      x:        device.x,
      y:        device.y,
    };
  });

  return {
    path:         hops,
    currentIndex: 0,
    x:            hops[0].x,
    y:            hops[0].y,
    done:         false,
  };
}

// ─── Step simulation ───────────────────────────────────────────────────────────
// Pure function — takes current state, returns next state.
// The store calls this on each tick interval.

export function stepSimulation(state: SimState): SimState {
  if (state.done) return state;

  const nextIndex = state.currentIndex + 1;

  if (nextIndex >= state.path.length) {
    return { ...state, done: true };
  }

  const nextHop = state.path[nextIndex];
  return {
    ...state,
    currentIndex: nextIndex,
    x:            nextHop.x,
    y:            nextHop.y,
  };
}

// ─── Current hop tooltip ───────────────────────────────────────────────────────

export function getCurrentHopAction(state: SimState): string {
  return state.path[state.currentIndex]?.action ?? '';
}
