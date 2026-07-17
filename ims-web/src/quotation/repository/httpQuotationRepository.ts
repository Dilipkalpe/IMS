import { apiFetch } from '../../api/client';
import { appendTransactionListQueryParams } from '../../components/transaction/transactionListQuery';
import { buildSavePayload, recordToEditor } from './recordMappers';
import type {
  QuotationListQuery,
  QuotationListResult,
  QuotationListStats,
  QuotationNextNo,
  QuotationRecord,
  QuotationRepository,
  SaveQuotationInput,
  SaveQuotationResult,
} from './types';

const BASE = '/api/quotations';

export class HttpQuotationRepository implements QuotationRepository {
  readonly mode = 'http' as const;

  async fetchList(query: QuotationListQuery = {}): Promise<QuotationListResult> {
    const params = new URLSearchParams();
    appendTransactionListQueryParams(params, query);
    const q = params.toString();
    return apiFetch<QuotationListResult>(`${BASE}${q ? `?${q}` : ''}`);
  }

  async fetchStats(): Promise<QuotationListStats> {
    const stats = await apiFetch<{
      total: number;
      draft: number;
      open: number;
      confirmed: number;
    }>(`${BASE}/stats`);
    return { total: stats.total, draft: stats.draft, open: stats.open, confirmed: stats.confirmed };
  }

  async loadById(id: string): Promise<QuotationRecord> {
    return normalizeRecord(await apiFetch<QuotationRecord & { id?: string }>(`${BASE}/${id}`));
  }

  async loadByFormatted(formatted: string): Promise<QuotationRecord> {
    const enc = encodeURIComponent(formatted);
    return normalizeRecord(
      await apiFetch<QuotationRecord & { id?: string }>(`${BASE}/by-formatted/${enc}`),
    );
  }

  async peekNextNo(prefix?: string): Promise<QuotationNextNo> {
    const q = prefix ? `?prefix=${encodeURIComponent(prefix)}` : '';
    return apiFetch<QuotationNextNo>(`${BASE}/next-no${q}`);
  }

  async save(input: SaveQuotationInput): Promise<SaveQuotationResult> {
    const payload = buildSavePayload(input);
    if (input.id) {
      const item = await apiFetch<QuotationRecord & { id?: string }>(`${BASE}/${input.id}`, {
        method: 'PUT',
        body: JSON.stringify(payload),
      });
      return { record: normalizeRecord(item), created: false };
    }
    const item = await apiFetch<QuotationRecord & { id?: string }>(BASE, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    return { record: normalizeRecord(item), created: true };
  }

  async deleteById(id: string): Promise<void> {
    await apiFetch(`${BASE}/${id}`, { method: 'DELETE' });
  }
}

function normalizeRecord(raw: QuotationRecord & { id?: string }): QuotationRecord {
  return { ...raw, _id: String(raw._id ?? raw.id ?? '') };
}

export { recordToEditor };
