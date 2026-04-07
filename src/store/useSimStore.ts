import { create } from 'zustand';
import type { SimState } from '../types/simulation';
import { buildSimulation, stepSimulation } from '../engine/simulation';
import { useCanvasStore } from './useCanvasStore';

interface SimStoreState {
  simState:    SimState | null;
  isSimulating: boolean;

  run:  () => void;   // build sim from current canvas and start
  tick: () => void;   // advance one hop
  stop: () => void;   // cancel
}

export const useSimStore = create<SimStoreState>((set, get) => ({
  simState:     null,
  isSimulating: false,

  run() {
    const { devices, connections } = useCanvasStore.getState();

    // Find first and last host as default endpoints
    const hosts = devices.filter(d => d.kind === 'host');
    if (hosts.length < 2) return;

    const state = buildSimulation(devices, connections, hosts[0].id, hosts[hosts.length - 1].id);
    if (!state) return;

    set({ simState: state, isSimulating: true });
  },

  tick() {
    const { simState } = get();
    if (!simState || simState.done) {
      set({ isSimulating: false });
      return;
    }
    const next = stepSimulation(simState);
    set({ simState: next, isSimulating: !next.done });
  },

  stop() {
    set({ simState: null, isSimulating: false });
  },
}));
