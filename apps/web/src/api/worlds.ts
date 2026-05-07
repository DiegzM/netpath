import { apiRequest } from '../auth/api';
import { getAccessToken } from '../auth/storage';
import type { Device } from '../types/device';
import type { Connection } from '../types/connection';

export interface WorldSummary {
  id: string;
  title: string;
  description: string;
  thumbnailData: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface WorldDetail extends WorldSummary {
  canvasData: {
    devices: Device[];
    connections: Connection[];
    simulationSettings?: Record<string, unknown>;
  };
}

function token() {
  return getAccessToken() ?? undefined;
}

export async function listWorlds(): Promise<WorldSummary[]> {
  const res = await apiRequest<{ worlds: WorldSummary[] }>('/worlds', { token: token() });
  return res.worlds;
}

export async function createWorld(title = 'Untitled World', description = ''): Promise<WorldDetail> {
  const res = await apiRequest<{ world: WorldDetail }>('/worlds', {
    method: 'POST',
    token: token(),
    body: { title, description },
  });
  return res.world;
}

export async function getWorld(id: string): Promise<WorldDetail> {
  const res = await apiRequest<{ world: WorldDetail }>(`/worlds/${id}`, { token: token() });
  return res.world;
}

export async function saveWorld(
  id: string,
  data: {
    title: string;
    description: string;
    thumbnailData?: string | null;
    canvasData: { devices: Device[]; connections: Connection[]; simulationSettings?: Record<string, unknown> };
  },
): Promise<WorldDetail> {
  const res = await apiRequest<{ world: WorldDetail }>(`/worlds/${id}`, {
    method: 'PUT',
    token: token(),
    body: data,
  });
  return res.world;
}

export async function deleteWorld(id: string): Promise<void> {
  await apiRequest(`/worlds/${id}`, {
    method: 'DELETE',
    token: token(),
  });
}
