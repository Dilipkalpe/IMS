import { apiFetch } from './client';

export interface DataCollectionSummary {
  label: string;
  count: number;
}

export interface DataSummary {
  totalRecords: number;
  collections: Record<string, DataCollectionSummary>;
}

export const PURGE_CONFIRM_PHRASE = 'DELETE ALL IMS DATA';

export async function fetchDataSummary(): Promise<DataSummary> {
  return apiFetch<DataSummary>('/api/admin/data/summary');
}

export async function purgeAllData(confirmPhrase: string): Promise<{ success: boolean; message: string }> {
  return apiFetch('/api/admin/data/purge', {
    method: 'POST',
    body: JSON.stringify({ confirmPhrase }),
  });
}
