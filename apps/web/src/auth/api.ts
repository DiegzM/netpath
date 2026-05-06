const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api/v1';

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT';
  token?: string;
  body?: unknown;
}

export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, {
    method: options.method ?? 'GET',
    headers: {
      'Content-Type': 'application/json',
      ...(options.token ? { Authorization: `Bearer ${options.token}` } : {}),
    },
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    const message = typeof payload?.message === 'string' ? payload.message : 'Request failed.';
    throw new Error(message);
  }

  return payload as T;
}
