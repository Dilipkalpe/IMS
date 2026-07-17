import { apiFetch } from '../../api/client';
import { appendTransactionListQueryParams } from '../../components/transaction/transactionListQuery';
import { buildSavePayload, recordToEditor } from './recordMappers';
import type {
  PurchaseReturnListQuery,
  PurchaseReturnListResult,
  PurchaseReturnListStats,
  PurchaseReturnNextNo,
  PurchaseReturnRecord,
  PurchaseReturnRepository,
  SavePurchaseReturnInput,
  SavePurchaseReturnResult,
} from './types';

const BASE = '/api/purchase-returns';

export class HttpPurchaseReturnRepository implements PurchaseReturnRepository {
  readonly mode = 'http' as const;

  async fetchList(query: PurchaseReturnListQuery = {}): Promise<PurchaseReturnListResult> {
    const params = new URLSearchParams();
    appendTransactionListQueryParams(params, query);
    const q = params.toString();
    return apiFetch<PurchaseReturnListResult>(`${BASE}${q ? `?${q}` : ''}`);
  }

  async fetchStats(): Promise<PurchaseReturnListStats> {
    const stats = await apiFetch<{
      total: number;
      draft: number;
      open: number;
      confirmed: number;
    }>(`${BASE}/stats`);
    return { total: stats.total, draft: stats.draft, open: stats.open, confirmed: stats.confirmed };
  }

  async loadById(id: string): Promise<PurchaseReturnRecord> {
    return normalizeRecord(await apiFetch<PurchaseReturnRecord & { id?: string }>(`${BASE}/${id}`));
  }

  async loadByFormatted(formatted: string): Promise<PurchaseReturnRecord> {
    const enc = encodeURIComponent(formatted);
    return normalizeRecord(
      await apiFetch<PurchaseReturnRecord & { id?: string }>(`${BASE}/by-formatted/${enc}`),
    );
  }

  async peekNextNo(prefix?: string): Promise<PurchaseReturnNextNo> {
    const q = prefix ? `?prefix=${encodeURIComponent(prefix)}` : '';
    return apiFetch<PurchaseReturnNextNo>(`${BASE}/next-no${q}`);
  }

  async save(input: SavePurchaseReturnInput): Promise<SavePurchaseReturnResult> {
    const payload = buildSavePayload(input);
    if (input.id) {
      const item = await apiFetch<PurchaseReturnRecord & { id?: string }>(`${BASE}/${input.id}`, {
        method: 'PUT',
        body: JSON.stringify(payload),
      });
      return { record: normalizeRecord(item), created: false };
    }
    const item = await apiFetch<PurchaseReturnRecord & { id?: string }>(BASE, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    return { record: normalizeRecord(item), created: true };
  }

  async deleteById(id: string): Promise<void> {
    await apiFetch(`${BASE}/${id}`, { method: 'DELETE' });
  }
}

function normalizeRecord(raw: PurchaseReturnRecord & { id?: string }): PurchaseReturnRecord {
  return { ...raw, _id: String(raw._id ?? raw.id ?? '') };
}

export { recordToEditor };
