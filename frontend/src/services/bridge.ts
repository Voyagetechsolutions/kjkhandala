import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

const bridge = axios.create({
  baseURL: `${API_BASE_URL}/bridge`,
  headers: { 'Content-Type': 'application/json' },
  timeout: 30000,
});

export type BridgeAction = 'get' | 'create' | 'update' | 'delete';

export interface BridgeRequest {
  table: string;
  action: BridgeAction;
  columns?: Array<{ name: string; type: string; constraints?: string }>;
  data?: Record<string, any>;
  where?: Record<string, any>;
  options?: { columns?: string; limit?: number; orderBy?: string; ascending?: boolean };
}

export async function bridgeRequest<T = any>(payload: BridgeRequest): Promise<T> {
  const { data } = await bridge.post('/', payload);
  if (!data?.ok) throw new Error(data?.message || 'Request failed');
  return data.data as T;
}
