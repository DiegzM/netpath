import type { Device } from '../types/device';
import type { Connection } from '../types/connection';

// ─── Adjacency ─────────────────────────────────────────────────────────────────

export function getNeighbors(connections: Connection[], deviceId: string): string[] {
  return connections
    .filter(c => c.from === deviceId || c.to === deviceId)
    .map(c => c.from === deviceId ? c.to : c.from);
}

// ─── BFS pathfinding ───────────────────────────────────────────────────────────

// Returns the shortest path of device ids from startId to endId, or [] if none.
export function findPath(
  devices: Device[],
  connections: Connection[],
  startId: string,
  endId: string,
): string[] {
  if (startId === endId) return [startId];

  const visited = new Set<string>([startId]);
  const queue: string[][] = [[startId]];

  while (queue.length) {
    const path = queue.shift()!;
    const current = path[path.length - 1];

    for (const neighbor of getNeighbors(connections, current)) {
      if (neighbor === endId) return [...path, neighbor];
      if (!visited.has(neighbor)) {
        visited.add(neighbor);
        queue.push([...path, neighbor]);
      }
    }
  }

  return []; // no path found
}

// ─── Reachability ──────────────────────────────────────────────────────────────

export function isReachable(
  devices: Device[],
  connections: Connection[],
  fromId: string,
  toId: string,
): boolean {
  return findPath(devices, connections, fromId, toId).length > 0;
}

// ─── VLAN-aware reachability ───────────────────────────────────────────────────
// Two devices can reach each other only if there's a path where every
// connection shares their VLAN (or is a trunk).

export function isVlanReachable(
  devices: Device[],
  connections: Connection[],
  fromId: string,
  toId: string,
  vlanId: number,
): boolean {
  const vlanConns = connections.filter(
    c => c.config.portMode === 'trunk' ||
         c.config.vlanId === vlanId    ||
         c.config.vlanId === undefined    // untagged = VLAN 1 by convention
  );
  return findPath(devices, vlanConns, fromId, toId).length > 0;
}

// ─── Connected components ──────────────────────────────────────────────────────
// Returns groups of device ids that are connected to each other.

export function getConnectedComponents(
  devices: Device[],
  connections: Connection[],
): string[][] {
  const visited = new Set<string>();
  const components: string[][] = [];

  for (const device of devices) {
    if (visited.has(device.id)) continue;

    const component: string[] = [];
    const queue = [device.id];

    while (queue.length) {
      const id = queue.shift()!;
      if (visited.has(id)) continue;
      visited.add(id);
      component.push(id);
      queue.push(...getNeighbors(connections, id).filter(n => !visited.has(n)));
    }

    components.push(component);
  }

  return components;
}

// ─── Topology queries ──────────────────────────────────────────────────────────

export function hasDeviceKind(devices: Device[], kind: string): boolean {
  return devices.some(d => d.kind === kind);
}

export function getDevicesByKind(devices: Device[], kind: string): Device[] {
  return devices.filter(d => d.kind === kind);
}

// Returns all connections involving a specific device
export function getConnectionsForDevice(
  connections: Connection[],
  deviceId: string,
): Connection[] {
  return connections.filter(c => c.from === deviceId || c.to === deviceId);
}
