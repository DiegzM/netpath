import type { Connection } from '../types/connection';
import type { Device } from '../types/device';
import type { StagePathStep, StageStreamConfig, ValidationStatus } from '../types/curriculum';
import type { SimHop, SimMessage, SimPacketState, SimState } from '../types/simulation';
import { findPath } from './graph';

const WEBSITE_FAILURES = [
  'google.com could not be accessed!',
  'github.com could not be resolved!',
  'youtube.com failed to load!',
  'wikipedia.org could not be reached!',
  'openai.com timed out!',
];

const DNS_SUCCESSES = [
  'DNS resolved google.com successfully.',
  'DNS lookup returned github.com.',
  'DNS translated wikipedia.org into an IP.',
];

const FIREWALL_SUCCESSES = [
  'Firewall screened the inbound packet.',
  'Firewall inspection completed before delivery.',
  'Inbound traffic was filtered by the firewall.',
];

function randomItem<T>(items: T[]): T {
  return items[Math.floor(Math.random() * items.length)];
}

function hasConnectionBetween(connections: Connection[], idA: string, idB: string): boolean {
  return connections.some(
    c => (c.from === idA && c.to === idB) ||
         (c.from === idB && c.to === idA),
  );
}

function isTrafficEndpoint(device: Device): boolean {
  return device.kind === 'host' || device.kind === 'internet';
}

function hopAction(device: Device, prevDevice: Device | undefined, nextDevice: Device | undefined): string {
  switch (device.kind) {
    case 'host':
      if (!prevDevice) return `${device.label} sends an application request`;
      if (!nextDevice) return `${device.label} receives the response`;
      return `${device.label} forwards data to ${nextDevice.label}`;
    case 'switch':
      return `Switch checks the MAC table and forwards to ${nextDevice?.label ?? 'the next hop'}`;
    case 'router':
      return `Router checks the routing table and forwards to ${nextDevice?.label ?? 'the next hop'}`;
    case 'dns-server':
      return 'DNS server translates a domain into an IP address';
    case 'firewall':
      return 'Firewall inspects the packet against its rules';
    case 'access-point':
      return 'Access point bridges the wireless and wired segments';
    case 'internet':
      return prevDevice ? 'Traffic returns from the public internet' : 'Traffic leaves for the public internet';
    default:
      return `Forwarding to ${nextDevice?.label ?? 'the next hop'}`;
  }
}

function pathIncludesKind(devices: Device[], pathIds: string[], kind: Device['kind']): boolean {
  return pathIds.some((id) => devices.find((device) => device.id === id)?.kind === kind);
}

function canReachKind(
  devices: Device[],
  connections: Connection[],
  fromId: string,
  kind: Device['kind'],
): boolean {
  return devices
    .filter((device) => device.kind === kind)
    .some((device) => findPath(devices, connections, fromId, device.id).length > 0);
}

function buildPacketMessage(
  devices: Device[],
  connections: Connection[],
  from: Device,
  to: Device,
  pathIds: string[],
): SimMessage | undefined {
  const trafficPassesFirewall = pathIncludesKind(devices, pathIds, 'firewall');
  const sourceCanReachDns = from.kind === 'host' && canReachKind(devices, connections, from.id, 'dns-server');

  if (from.kind === 'internet' && to.kind === 'host' && !trafficPassesFirewall) {
    return {
      text: 'Potentially unsafe packet!',
      tone: 'warning',
    };
  }

  if (from.kind === 'internet' && to.kind === 'host' && trafficPassesFirewall && Math.random() < 0.35) {
    return {
      text: randomItem(FIREWALL_SUCCESSES),
      tone: 'info',
    };
  }

  if (from.kind === 'host' && to.kind === 'internet' && !sourceCanReachDns && Math.random() < 0.45) {
    return {
      text: randomItem(WEBSITE_FAILURES),
      tone: 'danger',
    };
  }

  if (from.kind === 'host' && to.kind === 'internet' && sourceCanReachDns && Math.random() < 0.35) {
    return {
      text: randomItem(DNS_SUCCESSES),
      tone: 'info',
    };
  }

  return undefined;
}

function createPacketFromPath(
  devices: Device[],
  connections: Connection[],
  from: Device,
  to: Device,
  pathIds: string[],
  options: { includeMessage?: boolean } = {},
): SimPacketState {
  const hops: SimHop[] = pathIds.map((id, index) => {
    const device = devices.find((candidate) => candidate.id === id)!;
    const prevDevice = index > 0 ? devices.find((candidate) => candidate.id === pathIds[index - 1]) : undefined;
    const nextDevice =
      index < pathIds.length - 1 ? devices.find((candidate) => candidate.id === pathIds[index + 1]) : undefined;

    return {
      deviceId: id,
      action: hopAction(device, prevDevice, nextDevice),
      x: device.x,
      y: device.y,
    };
  });

  return {
    id: `pkt-${from.id}-${to.id}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    sourceId: from.id,
    targetId: to.id,
    path: hops,
    currentIndex: 0,
    x: hops[0].x,
    y: hops[0].y,
    done: false,
    message: options.includeMessage === false ? undefined : buildPacketMessage(devices, connections, from, to, pathIds),
  };
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

export function canRunStageStream(
  stream: StageStreamConfig,
  devices: Device[],
  connections: Connection[],
): boolean {
  return resolveStageStreamPath(stream, devices, connections) !== null;
}

export function createStageTrafficPacket(
  stream: StageStreamConfig,
  devices: Device[],
  connections: Connection[],
): SimPacketState | null {
  const path = resolveStageStreamPath(stream, devices, connections);
  if (!path) return null;

  return createPacketFromPath(
    devices,
    connections,
    path[0],
    path[path.length - 1],
    path.map((device) => device.id),
    { includeMessage: false },
  );
}

export function getTrafficEndpoints(devices: Device[]): Device[] {
  return devices.filter(isTrafficEndpoint);
}

export function canSimulateTraffic(devices: Device[], connections: Connection[]): boolean {
  const endpoints = getTrafficEndpoints(devices);

  for (const from of endpoints) {
    for (const to of endpoints) {
      if (from.id === to.id) continue;
      if (findPath(devices, connections, from.id, to.id).length > 0) {
        return true;
      }
    }
  }

  return false;
}

export function createTrafficPacket(devices: Device[], connections: Connection[]): SimPacketState | null {
  const endpoints = getTrafficEndpoints(devices);
  const candidates: Array<{ from: Device; to: Device; pathIds: string[] }> = [];
  const internetCandidates: Array<{ from: Device; to: Device; pathIds: string[] }> = [];

  for (const from of endpoints) {
    for (const to of endpoints) {
      if (from.id === to.id) continue;
      const pathIds = findPath(devices, connections, from.id, to.id);
      if (pathIds.length > 0) {
        const candidate = { from, to, pathIds };
        candidates.push(candidate);
        if (from.kind === 'internet' || to.kind === 'internet') {
          internetCandidates.push(candidate);
        }
      }
    }
  }

  if (!candidates.length) return null;

  const route =
    internetCandidates.length > 0 && Math.random() < 0.65
      ? randomItem(internetCandidates)
      : randomItem(candidates);
  return createPacketFromPath(devices, connections, route.from, route.to, route.pathIds);
}

export function stepSimulation(packet: SimPacketState): SimPacketState | null {
  if (packet.done) return null;

  const nextIndex = packet.currentIndex + 1;
  if (nextIndex >= packet.path.length) {
    return { ...packet, done: true };
  }

  const nextHop = packet.path[nextIndex];
  return {
    ...packet,
    currentIndex: nextIndex,
    x: nextHop.x,
    y: nextHop.y,
  };
}

export function tickSimulation(state: SimState): SimState {
  const steppedPackets = state.packets
    .map((packet) => stepSimulation(packet))
    .filter((packet): packet is SimPacketState => packet !== null && !packet.done);

  return {
    packets: steppedPackets,
    tickCount: state.tickCount + 1,
  };
}

export function getCurrentHopAction(packet: SimPacketState): string {
  return packet.path[packet.currentIndex]?.action ?? '';
}
