import { apiFetch } from '../../api/client';
import { appendTransactionListQueryParams } from '../../components/transaction/transactionListQuery';
import { buildSavePayload, recordToHeader, recordToLines } from './recordMappers';
import type {
  SalesInvoiceListQuery,
  SalesInvoiceListResult,
  SalesInvoiceListStats,
  SalesInvoiceNextNo,
  SalesInvoiceRecord,
  SalesInvoiceRepository,
  SaveSalesInvoiceInput,
  SaveSalesInvoiceResult,
} from './types';

const BASE = '/api/sales-invoices';

export class HttpSalesInvoiceRepository implements SalesInvoiceRepository {
  readonly mode = 'http' as const;

  async fetchList(query: SalesInvoiceListQuery = {}): Promise<SalesInvoiceListResult> {
    const params = new URLSearchParams();
    appendTransactionListQueryParams(params, query);
    const q = params.toString();
    return apiFetch<SalesInvoiceListResult>(`${BASE}${q ? `?${q}` : ''}`);
  }

  async fetchStats(): Promise<SalesInvoiceListStats> {
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

  async loadById(id: string): Promise<SalesInvoiceRecord> {
    const item = await apiFetch<SalesInvoiceRecord & { id?: string }>(`${BASE}/${id}`);
    return normalizeRecord(item);
  }

  async loadByFormatted(formatted: string): Promise<SalesInvoiceRecord> {
    const enc = encodeURIComponent(formatted);
    const item = await apiFetch<SalesInvoiceRecord & { id?: string }>(`${BASE}/by-formatted/${enc}`);
    return normalizeRecord(item);
  }

  async peekNextNo(prefix?: string): Promise<SalesInvoiceNextNo> {
    const q = prefix ? `?prefix=${encodeURIComponent(prefix)}` : '';
    return apiFetch<SalesInvoiceNextNo>(`${BASE}/next-no${q}`);
  }

  async save(input: SaveSalesInvoiceInput): Promise<SaveSalesInvoiceResult> {
    const payload = buildSavePayload(input);
    if (input.id) {
      const item = await apiFetch<SalesInvoiceRecord & { id?: string }>(`${BASE}/${input.id}`, {
        method: 'PUT',
        body: JSON.stringify(payload),
      });
      return { record: normalizeRecord(item), created: false };
    }
    const item = await apiFetch<SalesInvoiceRecord & { id?: string }>(BASE, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    return { record: normalizeRecord(item), created: true };
  }

  async deleteById(id: string): Promise<void> {
    await apiFetch(`${BASE}/${id}`, { method: 'DELETE' });
  }
}

function normalizeRecord(raw: SalesInvoiceRecord & { id?: string }): SalesInvoiceRecord {
  const _id = raw._id ?? raw.id ?? '';
  return { ...raw, _id: String(_id) };
}

export function recordToEditor(record: SalesInvoiceRecord) {
  return {
    documentId: record._id,
    header: recordToHeader(record),
    lines: recordToLines(record),
  };
}
