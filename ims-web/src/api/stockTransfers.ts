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

export async function createStockTransfer(
  transfer: StockTransferRecord,
): Promise<StockTransferRecord> {
  return apiFetch<StockTransferRecord>('/api/stock-transfers', {
    method: 'POST',
    body: JSON.stringify(transfer),
  });
}
