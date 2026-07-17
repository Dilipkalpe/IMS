import { apiFetch, probeApiHealth } from './client';

export interface CashEntryLine {
  srNo?: number;
  particular: string;
  amount: number;
}

export interface CashEntryRecord {
  _id?: string;
  entryType?: string;
  entryNo: number;
  entryDate?: string;
  lines: CashEntryLine[];
  totalAmount: number;
  status?: string;
}

export interface CashEntryListResult {
  items: CashEntryRecord[];
  total: number;
  page: number;
  limit: number;
}

export interface CreateCashEntryInput {
  entryNo?: number;
  entryDate?: string;
  lines: CashEntryLine[];
  status?: string;
}

export async function fetchCashEntryList(params?: {
  page?: number;
  limit?: number;
  search?: string;
}): Promise<CashEntryListResult> {
  const q = new URLSearchParams();
  if (params?.page != null) q.set('page', String(params.page));
  if (params?.limit != null) q.set('limit', String(params.limit));
  if (params?.search?.trim()) q.set('search', params.search.trim());
  const qs = q.toString();
  return apiFetch<CashEntryListResult>(`/api/cash-entries${qs ? `?${qs}` : ''}`);
}

export async function fetchNextCashEntryNo(): Promise<number | null> {
  try {
    const apiUp = await probeApiHealth();
    if (!apiUp) return null;
    const result = await apiFetch<{ entryNo: number }>('/api/cash-entries/next-no');
    return result.entryNo;
  } catch {
    return null;
  }
}

export async function createCashEntry(input: CreateCashEntryInput): Promise<CashEntryRecord> {
  return apiFetch<CashEntryRecord>('/api/cash-entries', {
    method: 'POST',
    body: JSON.stringify({
      entryType: 'cash_entry',
      status: 'Posted',
      ...input,
    }),
  });
}
