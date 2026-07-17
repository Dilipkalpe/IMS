import { apiFetch, probeApiHealth } from './client';

export type VoucherApiPath =
  | 'payment-vouchers'
  | 'receipt-vouchers'
  | 'credit-notes'
  | 'debit-notes'
  | 'bank-entries';

export interface VoucherRecord {
  _id?: string;
  voucherType?: string;
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

export interface VoucherListResult {
  items: VoucherRecord[];
  total: number;
  page: number;
  limit: number;
}

export interface CreateVoucherInput {
  voucherNo?: number;
  refNo?: string;
  voucherDate?: string;
  cashBank?: string;
  accountCode?: string;
  accountName?: string;
  amount: number;
  narration?: string;
  status?: string;
  voucherType?: string;
  sourceDocType?: string;
  sourceDocId?: string;
  sourceFormattedDocNo?: string;
}

export async function fetchVoucherList(
  apiPath: VoucherApiPath,
  params?: { page?: number; limit?: number; search?: string },
): Promise<VoucherListResult> {
  const q = new URLSearchParams();
  if (params?.page != null) q.set('page', String(params.page));
  if (params?.limit != null) q.set('limit', String(params.limit));
  if (params?.search?.trim()) q.set('search', params.search.trim());
  const qs = q.toString();
  return apiFetch<VoucherListResult>(`/api/${apiPath}${qs ? `?${qs}` : ''}`);
}

export async function fetchNextVoucherNo(apiPath: VoucherApiPath): Promise<number | null> {
  try {
    const apiUp = await probeApiHealth();
    if (!apiUp) return null;
    const result = await apiFetch<{ voucherNo: number }>(`/api/${apiPath}/next-no`);
    return result.voucherNo;
  } catch {
    return null;
  }
}

export async function createVoucher(
  apiPath: VoucherApiPath,
  input: CreateVoucherInput,
): Promise<VoucherRecord> {
  return apiFetch<VoucherRecord>(`/api/${apiPath}`, {
    method: 'POST',
    body: JSON.stringify({
      status: 'Posted',
      ...input,
    }),
  });
}
