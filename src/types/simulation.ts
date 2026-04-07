// ─── Simulation types ──────────────────────────────────────────────────────────

// A single hop in the simulation path with metadata for the tooltip
export interface SimHop {
  deviceId:   string;
  action:     string;  // e.g. "Router checks routing table → forwards to next hop"
  x:          number;
  y:          number;
}

// Full simulation state — produced by engine/simulation.ts
export interface SimState {
  path:         SimHop[];
  currentIndex: number;
  x:            number;
  y:            number;
  done:         boolean;
}
