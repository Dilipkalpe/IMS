import { apiFetch, probeApiHealth } from './client';

export interface ReceiptVoucherRecord {
  _id?: string;
  voucherType: string;
  voucherNo: number;
  refNo?: string;
  voucherDate?: string;
  cashBank?: string;
  accountCode?: string;
  accountName?: string;
  amount: number;
  narration?: string;
  status?: string;
  sourceDocType?: string;
  sourceDocId?: string;
  sourceFormattedDocNo?: string;
}

export interface CreateReceiptVoucherInput {
  voucherNo?: number;
  refNo?: string;
  voucherDate?: string;
  cashBank?: string;
  accountCode?: string;
  accountName?: string;
  amount: number;
  narration?: string;
  status?: string;
  sourceDocType?: string;
  sourceDocId?: string;
  sourceFormattedDocNo?: string;
}

export async function fetchNextReceiptVoucherNo(): Promise<number | null> {
  try {
    const apiUp = await probeApiHealth();
    if (!apiUp) return null;
    const result = await apiFetch<{ voucherNo: number }>('/api/receipt-vouchers/next-no');
    return result.voucherNo;
  } catch {
    return null;
  }
}

export async function fetchReceiptVoucherByNo(voucherNo: number): Promise<ReceiptVoucherRecord> {
  return apiFetch<ReceiptVoucherRecord>(`/api/receipt-vouchers/by-no/${voucherNo}`);
}

export async function createReceiptVoucher(
  input: CreateReceiptVoucherInput,
): Promise<ReceiptVoucherRecord> {
  return apiFetch<ReceiptVoucherRecord>('/api/receipt-vouchers', {
    method: 'POST',
    body: JSON.stringify({
      voucherType: 'receipt',
      status: 'Posted',
      ...input,
    }),
  });
}
