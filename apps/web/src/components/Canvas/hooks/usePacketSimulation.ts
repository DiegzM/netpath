import { useEffect, useMemo, useRef, useState } from 'react';
import { findPath } from '../../../engine/graph';
import type { Connection } from '../../../types/connection';
import type { Device } from '../../../types/device';

export interface SimPacket {
  id: string;
  path: string[];
  pathIndex: number;
  progress: number;
}

export interface SinglePacketRequest {
  sourceId: string;
  destinationId: string;
  requestId: number;
}

export type LinkPressureMap = Record<string, number>;
export type DeviceHeatMap = Record<string, number>;

const BANDWIDTH_CAPACITY = {
  low: 8,
  medium: 20,
  high: 45,
} as const;

const LATENCY_SPEED = {
  low: 0.018,
  medium: 0.01,
  high: 0.005,
} as const;

const MAX_DROP_CHANCE_PER_FRAME = 0.2;
const DEVICE_HEAT_WINDOW_MS = 3000;

function getConnectionBetween(connections: Connection[], aId: string, bId: string): Connection | undefined {
  return connections.find(
    (connection) =>
      (connection.from === aId && connection.to === bId) ||
      (connection.from === bId && connection.to === aId),
  );
}

function getPacketConnectionId(packet: SimPacket, connections: Connection[]): string | null {
  const fromId = packet.path[packet.pathIndex];
  const toId = packet.path[packet.pathIndex + 1];
  if (!fromId || !toId) return null;
  return getConnectionBetween(connections, fromId, toId)?.id ?? null;
}

function isTrafficEndpoint(device: Device): boolean {
  return device.kind === 'pc' || device.kind === 'server' || device.kind === 'internet';
}

export function hasRunnableTraffic(devices: Device[], connections: Connection[]): boolean {
  if (devices.length < 2 || connections.length < 1) return false;

  return devices.some((device) => {
    if (!isTrafficEndpoint(device)) return false;

    return (device.config.trafficRules ?? []).some((rule) => {
      if (!rule.destinationId || rule.destinationId === device.id) return false;
      const destination = devices.find((candidate) => candidate.id === rule.destinationId);
      if (!destination || !isTrafficEndpoint(destination)) return false;
      return findPath(devices, connections, device.id, destination.id).length > 1;
    });
  });
}

export function usePacketSimulation(
  devices: Device[],
  connections: Connection[],
  isRunning: boolean,
  singlePacketRequest?: SinglePacketRequest | null,
) {
  const [packets, setPackets] = useState<SimPacket[]>([]);
  const [deviceHeat, setDeviceHeat] = useState<DeviceHeatMap>({});

  // Stable refs so the rAF loop is never restarted just because packet count changed.
  const packetsRef = useRef<SimPacket[]>([]);
  const spawnDebtRef = useRef<Record<string, number>>({});
  const arrivalsRef = useRef<Array<{ deviceId: string; at: number }>>([]);
  const lastFrameRef = useRef<number | null>(null);
  const consumedSingleRequestIdRef = useRef<number>(0);

  // Keep a stable ref to the latest prop values so the rAF closure never goes stale.
  const devicesRef = useRef(devices);
  const connectionsRef = useRef(connections);
  const isRunningRef = useRef(isRunning);
  const singlePacketRequestRef = useRef(singlePacketRequest);
  devicesRef.current = devices;
  connectionsRef.current = connections;
  isRunningRef.current = isRunning;
  singlePacketRequestRef.current = singlePacketRequest;

  const canSimulate = useMemo(
    () => hasRunnableTraffic(devices, connections),
    [devices, connections],
  );

  const canSimulateRef = useRef(canSimulate);
  canSimulateRef.current = canSimulate;

  // Single stable rAF loop — never torn down/restarted from packet-count changes.
  useEffect(() => {
    let frameId = 0;
    let running = true;

    const frame = (now: number) => {
      if (!running) return;

      const currentDevices = devicesRef.current;
      const currentConnections = connectionsRef.current;
      const currentIsRunning = isRunningRef.current;
      const currentSingleReq = singlePacketRequestRef.current;
      const hasPendingSingle = Boolean(
        currentSingleReq && currentSingleReq.requestId > consumedSingleRequestIdRef.current,
      );

      // Stop the loop when there's nothing to do.
      if (!currentIsRunning && packetsRef.current.length === 0 && !hasPendingSingle) {
        frameId = requestAnimationFrame(frame);
        return;
      }

      const lastFrame = lastFrameRef.current ?? now;
      const deltaSeconds = Math.min((now - lastFrame) / 1000, 0.05);
      lastFrameRef.current = now;

      const previous = packetsRef.current;
      const linkCounts: Record<string, number> = {};
      previous.forEach((packet) => {
        const connectionId = getPacketConnectionId(packet, currentConnections);
        if (connectionId) linkCounts[connectionId] = (linkCounts[connectionId] ?? 0) + 1;
      });

      const nextPackets: SimPacket[] = [];

      previous.forEach((packet) => {
        const fromId = packet.path[packet.pathIndex];
        const toId = packet.path[packet.pathIndex + 1];
        const connection = fromId && toId ? getConnectionBetween(currentConnections, fromId, toId) : undefined;
        if (!connection) return;

        const capacity = BANDWIDTH_CAPACITY[connection.config.bandwidth ?? 'medium'];
        const pressure = (linkCounts[connection.id] ?? 0) / capacity;
        const overload = Math.max(0, pressure - 1);
        const dropChance = Math.min(MAX_DROP_CHANCE_PER_FRAME, overload * 0.015);
        if (dropChance > 0 && Math.random() < dropChance) return;

        const speed = LATENCY_SPEED[connection.config.latency ?? 'medium'] * 60 * deltaSeconds;
        const progress = packet.progress + speed;

        if (progress >= 1) {
          if (packet.pathIndex + 2 >= packet.path.length) {
            arrivalsRef.current.push({ deviceId: toId, at: now });
            return;
          }
          nextPackets.push({ ...packet, pathIndex: packet.pathIndex + 1, progress: 0 });
          return;
        }

        nextPackets.push({ ...packet, progress });
      });

      // Spawn continuous traffic when simulation is running.
      if (currentIsRunning && canSimulateRef.current) {
        currentDevices.forEach((device) => {
          if (!isTrafficEndpoint(device)) return;
          (device.config.trafficRules ?? []).forEach((rule) => {
            const destination = currentDevices.find((c) => c.id === rule.destinationId);
            if (!destination || !isTrafficEndpoint(destination)) return;
            const path = findPath(currentDevices, currentConnections, device.id, destination.id);
            if (path.length < 2) return;

            const debtKey = `${device.id}:${rule.id}`;
            const pps = Math.min(100, Math.max(1, rule.packetsPerSecond));
            spawnDebtRef.current[debtKey] = (spawnDebtRef.current[debtKey] ?? 0) + pps * deltaSeconds;

            while (spawnDebtRef.current[debtKey] >= 1) {
              spawnDebtRef.current[debtKey] -= 1;
              nextPackets.push({
                id: `p-${debtKey}-${now}-${Math.random().toString(36).slice(2)}`,
                path,
                pathIndex: 0,
                progress: 0,
              });
            }
          });
        });
      }

      // Inject one-shot packet — guarded by requestId so it fires exactly once.
      if (hasPendingSingle && currentSingleReq) {
        const src = currentDevices.find((d) => d.id === currentSingleReq.sourceId);
        const dst = currentDevices.find((d) => d.id === currentSingleReq.destinationId);
        if (src && dst && src.id !== dst.id) {
          const path = findPath(currentDevices, currentConnections, src.id, dst.id);
          if (path.length > 1) {
            nextPackets.push({
              id: `single-${currentSingleReq.requestId}-${Math.random().toString(36).slice(2)}`,
              path,
              pathIndex: 0,
              progress: 0,
            });
          }
        }
        // Mark consumed immediately (not inside setPackets) so re-renders can't re-trigger it.
        consumedSingleRequestIdRef.current = currentSingleReq.requestId;
      }

      // Reset debt when simulation stops.
      if (!currentIsRunning) {
        spawnDebtRef.current = {};
      }

      packetsRef.current = nextPackets;
      setPackets(nextPackets);

      // Update heat map.
      arrivalsRef.current = arrivalsRef.current.filter((a) => now - a.at <= DEVICE_HEAT_WINDOW_MS);
      const heat: DeviceHeatMap = {};
      arrivalsRef.current.forEach((a) => {
        heat[a.deviceId] = Math.min(1, (heat[a.deviceId] ?? 0) + 1 / 150);
      });
      setDeviceHeat(heat);

      frameId = requestAnimationFrame(frame);
    };

    frameId = requestAnimationFrame(frame);
    return () => {
      running = false;
      cancelAnimationFrame(frameId);
    };
  // Intentionally empty dep array — the loop runs forever and reads latest values from refs.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // When isRunning turns off, flush packets so the canvas clears.
  useEffect(() => {
    if (!isRunning) {
      spawnDebtRef.current = {};
    }
  }, [isRunning]);

  const linkPressure = useMemo(() => {
    const pressure: LinkPressureMap = {};

    connections.forEach((connection) => {
      const packetCount = packets.filter((packet) => getPacketConnectionId(packet, connections) === connection.id).length;
      const capacity = BANDWIDTH_CAPACITY[connection.config.bandwidth ?? 'medium'];
      pressure[connection.id] = packetCount / capacity;
    });

    return pressure;
  }, [connections, packets]);

  return {
    packets,
    linkPressure,
    deviceHeat,
    canSimulate,
  };
}
