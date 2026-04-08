export type SimMessageTone = 'info' | 'warning' | 'danger';

export interface SimHop {
  deviceId: string;
  action: string;
  x: number;
  y: number;
}

export interface SimMessage {
  text: string;
  tone: SimMessageTone;
}

export interface SimPacketState {
  id: string;
  sourceId: string;
  targetId: string;
  path: SimHop[];
  currentIndex: number;
  x: number;
  y: number;
  done: boolean;
  message?: SimMessage;
}

export interface SimState {
  packets: SimPacketState[];
  tickCount: number;
}
