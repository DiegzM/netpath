import { create } from 'zustand';
import type { SimState } from '../types/simulation';
import { canSimulateTraffic, createTrafficPacket, tickSimulation } from '../engine/simulation';
import { useCanvasStore } from './useCanvasStore';

const EMPTY_SIM_STATE: SimState = {
  packets: [],
  tickCount: 0,
};

interface SimStoreState {
  simState: SimState;
  isSimulating: boolean;

  run: () => void;
  tick: () => void;
  stop: () => void;
  toggle: () => void;
}

export const useSimStore = create<SimStoreState>((set, get) => ({
  simState: EMPTY_SIM_STATE,
  isSimulating: false,

  run() {
    const { devices, connections } = useCanvasStore.getState();
    if (!canSimulateTraffic(devices, connections)) return;

    const firstPacket = createTrafficPacket(devices, connections);
    set({
      simState: {
        packets: firstPacket ? [firstPacket] : [],
        tickCount: 0,
      },
      isSimulating: true,
    });
  },

  tick() {
    if (!get().isSimulating) return;

    const { devices, connections } = useCanvasStore.getState();
    if (!canSimulateTraffic(devices, connections)) {
      set({ simState: EMPTY_SIM_STATE, isSimulating: false });
      return;
    }

    set((state) => ({
      simState: tickSimulation(state.simState, devices, connections),
    }));
  },

  stop() {
    set({ simState: EMPTY_SIM_STATE, isSimulating: false });
  },

  toggle() {
    if (get().isSimulating) {
      get().stop();
      return;
    }

    get().run();
  },
}));
