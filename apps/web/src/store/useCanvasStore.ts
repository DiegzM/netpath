import { create } from 'zustand';
import type { Device }     from '../types/device';
import type { Connection } from '../types/connection';
import { DEFAULT_CONNECTION_CONFIG } from '../types/connection';
import { STAGES } from '../data/stages';

interface Snapshot {
  devices:     Device[];
  connections: Connection[];
}

const MAX_HISTORY = 50;

interface CanvasState {
  devices:          Device[];
  connections:      Connection[];
  selectedDeviceId: string | null;
  selectedIds:      Set<string>;
  drawingFrom:      string | null;
  past:             Snapshot[];
  future:           Snapshot[];

  addDevice:        (device: Device) => void;
  moveDevice:       (id: string, x: number, y: number) => void;
  moveSelected:     (dx: number, dy: number) => void;
  removeDevice:     (id: string) => void;
  removeSelected:   () => void;
  updateDevice:     (id: string, patch: Partial<Device>) => void;

  startDrawing:     (id: string) => void;
  finishDrawing:    (id: string) => void;
  cancelDrawing:    () => void;
  removeConnection: (id: string) => void;
  updateConnection: (id: string, patch: Partial<Connection>) => void;

  selectDevice:     (id: string | null) => void;
  toggleSelectId:   (id: string) => void;
  setSelectedIds:   (ids: Set<string>) => void;
  clearSelection:   () => void;

  undo: () => void;
  redo: () => void;

  resetToStage: (stageIndex: number) => void;
  clearCanvas:  () => void;
}

function snapshot(state: CanvasState): Snapshot {
  return { devices: state.devices, connections: state.connections };
}

function withHistory(
  get: () => CanvasState,
  set: (partial: Partial<CanvasState>) => void,
  patch: Partial<CanvasState>,
) {
  const current = snapshot(get());
  const past    = [...get().past.slice(-(MAX_HISTORY - 1)), current];
  set({ ...patch, past, future: [] });
}

export const useCanvasStore = create<CanvasState>((set, get) => ({
  devices:          [...STAGES[0].preplacedDevices],
  connections:      [],
  selectedDeviceId: null,
  selectedIds:      new Set(),
  drawingFrom:      null,
  past:             [],
  future:           [],

  addDevice(device) {
    withHistory(get, set, { devices: [...get().devices, device] });
  },

  moveDevice(id, x, y) {
    set(s => ({ devices: s.devices.map(d => d.id === id ? { ...d, x, y } : d) }));
  },

  moveSelected(dx, dy) {
    set(s => ({
      devices: s.devices.map(d =>
        s.selectedIds.has(d.id) ? { ...d, x: d.x + dx, y: d.y + dy } : d
      ),
    }));
  },

  removeDevice(id) {
    withHistory(get, set, {
      devices:          get().devices.filter(d => d.id !== id),
      connections:      get().connections.filter(c => c.from !== id && c.to !== id),
      selectedDeviceId: get().selectedDeviceId === id ? null : get().selectedDeviceId,
      selectedIds:      new Set([...get().selectedIds].filter(i => i !== id)),
    });
  },

  removeSelected() {
    const { selectedIds, selectedDeviceId } = get();
    if (selectedIds.size === 0 && !selectedDeviceId) return;
    const toDelete = selectedIds.size > 0 ? selectedIds : new Set([selectedDeviceId!]);
    withHistory(get, set, {
      devices:          get().devices.filter(d => !toDelete.has(d.id)),
      connections:      get().connections.filter(c => !toDelete.has(c.from) && !toDelete.has(c.to)),
      selectedDeviceId: null,
      selectedIds:      new Set(),
    });
  },

  updateDevice(id, patch) {
    withHistory(get, set, {
      devices: get().devices.map(d => d.id === id ? { ...d, ...patch } : d),
    });
  },

  startDrawing(id) { set({ drawingFrom: id }); },

  finishDrawing(toId) {
    const { drawingFrom, connections } = get();
    if (!drawingFrom || drawingFrom === toId) { set({ drawingFrom: null }); return; }
    const exists = connections.some(
      c => (c.from === drawingFrom && c.to === toId) ||
           (c.from === toId && c.to === drawingFrom)
    );
    if (!exists) {
      const newConn: Connection = {
        id:     `c-${drawingFrom}-${toId}-${Date.now()}`,
        from:   drawingFrom,
        to:     toId,
        config: { ...DEFAULT_CONNECTION_CONFIG },
      };
      withHistory(get, set, { connections: [...connections, newConn], drawingFrom: null });
    } else {
      set({ drawingFrom: null });
    }
  },

  cancelDrawing() { set({ drawingFrom: null }); },

  removeConnection(id) {
    withHistory(get, set, { connections: get().connections.filter(c => c.id !== id) });
  },

  updateConnection(id, patch) {
    withHistory(get, set, {
      connections: get().connections.map(c => c.id === id ? { ...c, ...patch } : c),
    });
  },

  selectDevice(id) { set({ selectedDeviceId: id, selectedIds: new Set() }); },

  toggleSelectId(id) {
    const next = new Set(get().selectedIds);
    if (next.has(id)) next.delete(id); else next.add(id);
    set({ selectedIds: next, selectedDeviceId: null });
  },

  setSelectedIds(ids) { set({ selectedIds: ids, selectedDeviceId: null }); },

  clearSelection() { set({ selectedDeviceId: null, selectedIds: new Set() }); },

  undo() {
    const { past, devices, connections, future } = get();
    if (!past.length) return;
    const prev = past[past.length - 1];
    set({
      devices:          prev.devices,
      connections:      prev.connections,
      past:             past.slice(0, -1),
      future:           [{ devices, connections }, ...future.slice(0, MAX_HISTORY - 1)],
      selectedDeviceId: null,
      selectedIds:      new Set(),
    });
  },

  redo() {
    const { future, devices, connections, past } = get();
    if (!future.length) return;
    const next = future[0];
    set({
      devices:          next.devices,
      connections:      next.connections,
      past:             [...past.slice(-(MAX_HISTORY - 1)), { devices, connections }],
      future:           future.slice(1),
      selectedDeviceId: null,
      selectedIds:      new Set(),
    });
  },

  resetToStage(stageIndex) {
    const stage = STAGES[stageIndex];
    if (!stage) return;
    set({
      devices:          [...stage.preplacedDevices],
      connections:      [],
      selectedDeviceId: null,
      selectedIds:      new Set(),
      drawingFrom:      null,
      past:             [],
      future:           [],
    });
  },

  clearCanvas() {
    withHistory(get, set, {
      devices:          [],
      connections:      [],
      selectedDeviceId: null,
      selectedIds:      new Set(),
      drawingFrom:      null,
    });
  },
}));