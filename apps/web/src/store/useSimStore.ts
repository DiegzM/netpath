import { create } from 'zustand';
import type { SimPacketState, SimState } from '../types/simulation';
import { canSimulateTraffic, createTrafficPacket, tickSimulation } from '../engine/simulation';
import { useCanvasStore } from './useCanvasStore';

const EMPTY_SIM_STATE: SimState = {
  packets: [],
  tickCount: 0,
};

interface SimStoreState {
  simState: SimState;
  isSimulating: boolean;

  run: (packet?: SimPacketState) => void;
  tick: () => void;
  stop: () => void;
  toggle: () => void;
}

export const useSimStore = create<SimStoreState>((set, get) => ({
  simState: EMPTY_SIM_STATE,
  isSimulating: false,

  run(packet) {
    const { devices, connections } = useCanvasStore.getState();
    if (!packet && !canSimulateTraffic(devices, connections)) return;

    const firstPacket = packet ?? createTrafficPacket(devices, connections);
    set({
      simState: {
        packets: firstPacket ? [firstPacket] : [],
        tickCount: 0,
      },
      isSimulating: firstPacket !== null,
    });
  },

  tick() {
    if (!get().isSimulating) return;

    const nextState = tickSimulation(get().simState);

    set({
      simState: nextState,
      isSimulating: nextState.packets.length > 0,
    });
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
