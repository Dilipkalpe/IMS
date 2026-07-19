import { apiFetch } from './client';

export interface StockTransferLine {
  srNo: number;
  productId?: string;
  productCode?: string;
  productName?: string;
  batchNo?: string;
  qty?: string;
  unit?: string;
}

export interface StockTransferRecord {
  entryNo: string;
  fromGodown: string;
  toGodown: string;
  transferDate?: string;
  remark?: string;
  status?: string;
  lines: StockTransferLine[];
}

export interface StockTransferPagedResult {
  items: StockTransferRecord[];
  total: number;
  page: number;
  limit: number;
}

export async function fetchStockTransfersPage(params?: {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
}): Promise<StockTransferPagedResult> {
  const q = new URLSearchParams();
  if (params?.page != null) q.set('page', String(params.page));
  if (params?.limit != null) q.set('limit', String(params.limit));
  if (params?.search?.trim()) q.set('search', params.search.trim());
  if (params?.status) q.set('status', params.status);
  const qs = q.toString();
  return apiFetch<StockTransferPagedResult>(`/api/stock-transfers${qs ? `?${qs}` : ''}`);
}

export async function createStockTransfer(
  transfer: StockTransferRecord,
): Promise<StockTransferRecord> {
  return apiFetch<StockTransferRecord>('/api/stock-transfers', {
    method: 'POST',
    body: JSON.stringify(transfer),
  });
}
