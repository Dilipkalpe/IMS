import { apiFetch } from '../../api/client';
import { appendTransactionListQueryParams } from '../../components/transaction/transactionListQuery';
import { buildSavePayload, recordToEditor } from './recordMappers';
import type {
  PurchaseInvoiceListQuery,
  PurchaseInvoiceListResult,
  PurchaseInvoiceListStats,
  PurchaseInvoiceNextNo,
  PurchaseInvoiceRecord,
  PurchaseInvoiceRepository,
  SavePurchaseInvoiceInput,
  SavePurchaseInvoiceResult,
} from './types';

const BASE = '/api/purchase-invoices';

export class HttpPurchaseInvoiceRepository implements PurchaseInvoiceRepository {
  readonly mode = 'http' as const;

  async fetchList(query: PurchaseInvoiceListQuery = {}): Promise<PurchaseInvoiceListResult> {
    const params = new URLSearchParams();
    appendTransactionListQueryParams(params, query);
    const q = params.toString();
    return apiFetch<PurchaseInvoiceListResult>(`${BASE}${q ? `?${q}` : ''}`);
  }

  async fetchStats(): Promise<PurchaseInvoiceListStats> {
    const stats = await apiFetch<{
      total: number;
      draft: number;
      posted: number;
      open?: number;
      active?: number;
    }>(`${BASE}/stats`);
    return {
      total: stats.total,
      draft: stats.draft,
      posted: stats.posted ?? stats.open ?? 0,
      open: stats.open,
      active: stats.active,
    };
  }

  async loadById(id: string): Promise<PurchaseInvoiceRecord> {
    const item = await apiFetch<PurchaseInvoiceRecord & { id?: string }>(`${BASE}/${id}`);
    return normalizeRecord(item);
  }

  async loadByFormatted(formatted: string): Promise<PurchaseInvoiceRecord> {
    const enc = encodeURIComponent(formatted);
    const item = await apiFetch<PurchaseInvoiceRecord & { id?: string }>(`${BASE}/by-formatted/${enc}`);
    return normalizeRecord(item);
  }

  async peekNextNo(prefix?: string): Promise<PurchaseInvoiceNextNo> {
    const q = prefix ? `?prefix=${encodeURIComponent(prefix)}` : '';
    return apiFetch<PurchaseInvoiceNextNo>(`${BASE}/next-no${q}`);
  }

  async save(input: SavePurchaseInvoiceInput): Promise<SavePurchaseInvoiceResult> {
    const payload = buildSavePayload(input);
    if (input.id) {
      const item = await apiFetch<PurchaseInvoiceRecord & { id?: string }>(`${BASE}/${input.id}`, {
        method: 'PUT',
        body: JSON.stringify(payload),
      });
      return { record: normalizeRecord(item), created: false };
    }
    const item = await apiFetch<PurchaseInvoiceRecord & { id?: string }>(BASE, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    return { record: normalizeRecord(item), created: true };
  }

  async deleteById(id: string): Promise<void> {
    await apiFetch(`${BASE}/${id}`, { method: 'DELETE' });
  }
}

function normalizeRecord(raw: PurchaseInvoiceRecord & { id?: string }): PurchaseInvoiceRecord {
  const _id = raw._id ?? raw.id ?? '';
  return { ...raw, _id: String(_id) };
}

export { recordToEditor };
