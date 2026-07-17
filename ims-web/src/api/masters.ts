import { apiFetch } from './client';

export interface MasterPagedResult {
  items: Record<string, unknown>[];
  total: number;
  page: number;
  limit: number;
}

export async function fetchMasterPage(
  apiPath: string,
  params?: { page?: number; limit?: number; search?: string; query?: Record<string, string> },
): Promise<MasterPagedResult> {
  const q = new URLSearchParams();
  if (params?.page != null) q.set('page', String(params.page));
  if (params?.limit != null) q.set('limit', String(params.limit));
  if (params?.search?.trim()) q.set('search', params.search.trim());
  if (params?.query) {
    for (const [key, value] of Object.entries(params.query)) {
      if (value) q.set(key, value);
    }
  }
  const qs = q.toString();
  return apiFetch<MasterPagedResult>(`/api/${apiPath}${qs ? `?${qs}` : ''}`);
}

export async function fetchMasterItemsArray(
  apiPath: string,
): Promise<Record<string, unknown>[]> {
  const result = await apiFetch<{ items: Record<string, unknown>[] }>(`/api/${apiPath}`);
  return Array.isArray(result.items) ? result.items : [];
}

export async function fetchMasterFlatArray(apiPath: string): Promise<Record<string, unknown>[]> {
  const result = await apiFetch<Record<string, unknown>[]>(`/api/${apiPath}`);
  return Array.isArray(result) ? result : [];
}

export type MasterKeyMode = 'by-code' | 'by-username' | 'by-id';

function resourcePath(apiPath: string, keyValue: string, keyMode: MasterKeyMode): string {
  const value = encodeURIComponent(keyValue.trim());
  if (keyMode === 'by-id') return `/api/${apiPath}/${value}`;
  return `/api/${apiPath}/${keyMode}/${value}`;
}

export async function getMasterRecord(
  apiPath: string,
  keyValue: string,
  keyMode: MasterKeyMode = 'by-code',
): Promise<Record<string, unknown>> {
  return apiFetch<Record<string, unknown>>(resourcePath(apiPath, keyValue, keyMode));
}

export async function createMasterRecord(
  apiPath: string,
  payload: Record<string, unknown>,
): Promise<Record<string, unknown>> {
  return apiFetch<Record<string, unknown>>(`/api/${apiPath}`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function updateMasterRecord(
  apiPath: string,
  keyValue: string,
  payload: Record<string, unknown>,
  keyMode: MasterKeyMode = 'by-code',
): Promise<Record<string, unknown>> {
  return apiFetch<Record<string, unknown>>(resourcePath(apiPath, keyValue, keyMode), {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
}

export async function deleteMasterRecord(
  apiPath: string,
  keyValue: string,
  keyMode: MasterKeyMode = 'by-code',
): Promise<void> {
  await apiFetch(resourcePath(apiPath, keyValue, keyMode), { method: 'DELETE' });
}
