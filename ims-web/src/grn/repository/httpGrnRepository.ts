import { apiFetch } from '../../api/client';
import { appendTransactionListQueryParams } from '../../components/transaction/transactionListQuery';
import { buildSavePayload, recordToEditor } from './recordMappers';
import type {
  GrnListQuery,
  GrnListResult,
  GrnListStats,
  GrnNextNo,
  GrnRecord,
  GrnRepository,
  SaveGrnInput,
  SaveGrnResult,
} from './types';

const BASE = '/api/grns';

export class HttpGrnRepository implements GrnRepository {
  readonly mode = 'http' as const;

  async fetchList(query: GrnListQuery = {}): Promise<GrnListResult> {
    const params = new URLSearchParams();
    appendTransactionListQueryParams(params, query);
    const q = params.toString();
    return apiFetch<GrnListResult>(`${BASE}${q ? `?${q}` : ''}`);
  }

  async fetchStats(): Promise<GrnListStats> {
    const stats = await apiFetch<{
      total: number;
      draft: number;
      open: number;
      posted: number;
    }>(`${BASE}/stats`);
    return { total: stats.total, draft: stats.draft, open: stats.open, posted: stats.posted };
  }

  async loadById(id: string): Promise<GrnRecord> {
    return normalizeRecord(await apiFetch<GrnRecord & { id?: string }>(`${BASE}/${id}`));
  }

  async loadByFormatted(formatted: string): Promise<GrnRecord> {
    const enc = encodeURIComponent(formatted);
    return normalizeRecord(await apiFetch<GrnRecord & { id?: string }>(`${BASE}/by-formatted/${enc}`));
  }

  async peekNextNo(prefix?: string): Promise<GrnNextNo> {
    const q = prefix ? `?prefix=${encodeURIComponent(prefix)}` : '';
    return apiFetch<GrnNextNo>(`${BASE}/next-no${q}`);
  }

  async save(input: SaveGrnInput): Promise<SaveGrnResult> {
    const payload = buildSavePayload(input);
    if (input.id) {
      const item = await apiFetch<GrnRecord & { id?: string }>(`${BASE}/${input.id}`, {
        method: 'PUT',
        body: JSON.stringify(payload),
      });
      return { record: normalizeRecord(item), created: false };
    }
    const item = await apiFetch<GrnRecord & { id?: string }>(BASE, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    return { record: normalizeRecord(item), created: true };
  }

  async deleteById(id: string): Promise<void> {
    await apiFetch(`${BASE}/${id}`, { method: 'DELETE' });
  }
}

function normalizeRecord(raw: GrnRecord & { id?: string }): GrnRecord {
  return { ...raw, _id: String(raw._id ?? raw.id ?? '') };
}

export { recordToEditor };
