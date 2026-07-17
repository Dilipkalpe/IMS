import { apiFetch } from './client';

export interface AppUserRecord {
  _id?: string;
  id?: string;
  username: string;
  fullName: string;
  role: string;
  department?: string;
  email?: string;
  activeStatus: boolean;
  canPrintBarcodeLabels?: boolean;
}

export interface UsersPagedResult {
  items: AppUserRecord[];
  total: number;
  page: number;
  limit: number;
}

export async function fetchUsersPage(params?: {
  page?: number;
  limit?: number;
  search?: string;
}): Promise<UsersPagedResult> {
  const q = new URLSearchParams();
  if (params?.page != null) q.set('page', String(params.page));
  if (params?.limit != null) q.set('limit', String(params.limit));
  if (params?.search?.trim()) q.set('search', params.search.trim());
  const qs = q.toString();
  return apiFetch<UsersPagedResult>(`/api/users${qs ? `?${qs}` : ''}`);
}

export async function getUserByUsername(username: string): Promise<AppUserRecord> {
  return apiFetch<AppUserRecord>(`/api/users/by-username/${encodeURIComponent(username.trim())}`);
}

export async function createUser(payload: Record<string, unknown>): Promise<AppUserRecord> {
  return apiFetch<AppUserRecord>('/api/users', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function updateUserByUsername(
  username: string,
  payload: Record<string, unknown>,
): Promise<AppUserRecord> {
  return apiFetch<AppUserRecord>(
    `/api/users/by-username/${encodeURIComponent(username.trim())}`,
    {
      method: 'PUT',
      body: JSON.stringify(payload),
    },
  );
}

export async function deleteUserByUsername(username: string): Promise<void> {
  await apiFetch(`/api/users/by-username/${encodeURIComponent(username.trim())}`, {
    method: 'DELETE',
  });
}

export function userFormToPayload(input: {
  username: string;
  fullName: string;
  role: string;
  department: string;
  email: string;
  password: string;
  activeStatus: boolean;
  canPrintBarcodeLabels: boolean;
}): Record<string, unknown> {
  const payload: Record<string, unknown> = {
    username: input.username.trim().toLowerCase(),
    fullName: input.fullName.trim(),
    role: input.role.trim(),
    department: input.department.trim(),
    email: input.email.trim(),
    activeStatus: input.activeStatus,
    canPrintBarcodeLabels: input.canPrintBarcodeLabels,
  };
  if (input.password.trim()) {
    payload.password = input.password;
  }
  return payload;
}
