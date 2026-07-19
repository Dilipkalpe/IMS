import { apiFetch } from './client';

export interface MachineRecord {
  _id?: string;
  code: string;
  name: string;
  activeStatus?: boolean;
}

export async function getMachineByCode(code: string): Promise<MachineRecord | null> {
  try {
    return await apiFetch<MachineRecord>(`/api/machines/by-code/${encodeURIComponent(code.trim())}`);
  } catch {
    return null;
  }
}
