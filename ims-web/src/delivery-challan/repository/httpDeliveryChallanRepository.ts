import { apiFetch } from '../../api/client';
import { appendTransactionListQueryParams } from '../../components/transaction/transactionListQuery';
import { buildSavePayload, recordToEditor } from './recordMappers';
import type {
  DeliveryChallanListQuery,
  DeliveryChallanListResult,
  DeliveryChallanListStats,
  DeliveryChallanNextNo,
  DeliveryChallanRecord,
  DeliveryChallanRepository,
  SaveDeliveryChallanInput,
  SaveDeliveryChallanResult,
} from './types';

const BASE = '/api/delivery-challans';

export class HttpDeliveryChallanRepository implements DeliveryChallanRepository {
  readonly mode = 'http' as const;

  async fetchList(query: DeliveryChallanListQuery = {}): Promise<DeliveryChallanListResult> {
    const params = new URLSearchParams();
    appendTransactionListQueryParams(params, query);
    const q = params.toString();
    return apiFetch<DeliveryChallanListResult>(`${BASE}${q ? `?${q}` : ''}`);
  }

  async fetchStats(): Promise<DeliveryChallanListStats> {
    const stats = await apiFetch<{
      total: number;
      draft: number;
      open: number;
      posted: number;
    }>(`${BASE}/stats`);
    return { total: stats.total, draft: stats.draft, open: stats.open, posted: stats.posted };
  }

  async loadById(id: string): Promise<DeliveryChallanRecord> {
    return normalizeRecord(await apiFetch<DeliveryChallanRecord & { id?: string }>(`${BASE}/${id}`));
  }

  async loadByFormatted(formatted: string): Promise<DeliveryChallanRecord> {
    const enc = encodeURIComponent(formatted);
    return normalizeRecord(await apiFetch<DeliveryChallanRecord & { id?: string }>(`${BASE}/by-formatted/${enc}`));
  }

  async peekNextNo(prefix?: string): Promise<DeliveryChallanNextNo> {
    const q = prefix ? `?prefix=${encodeURIComponent(prefix)}` : '';
    return apiFetch<DeliveryChallanNextNo>(`${BASE}/next-no${q}`);
  }

  async save(input: SaveDeliveryChallanInput): Promise<SaveDeliveryChallanResult> {
    const payload = buildSavePayload(input);
    if (input.id) {
      const item = await apiFetch<DeliveryChallanRecord & { id?: string }>(`${BASE}/${input.id}`, {
        method: 'PUT',
        body: JSON.stringify(payload),
      });
      return { record: normalizeRecord(item), created: false };
    }
    const item = await apiFetch<DeliveryChallanRecord & { id?: string }>(BASE, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    return { record: normalizeRecord(item), created: true };
  }

  async deleteById(id: string): Promise<void> {
    await apiFetch(`${BASE}/${id}`, { method: 'DELETE' });
  }
}

function normalizeRecord(raw: DeliveryChallanRecord & { id?: string }): DeliveryChallanRecord {
  return { ...raw, _id: String(raw._id ?? raw.id ?? '') };
}

export { recordToEditor };
