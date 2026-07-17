import { apiFetch, probeApiHealth } from './client';



export interface InvoiceAllocationInput {

  sourceDocType: string;

  sourceDocId?: string;

  sourceFormattedDocNo?: string;

  amount: number;

}



export interface PaymentVoucherRecord {

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

  invoiceAllocations?: InvoiceAllocationInput[];

}



export interface OutstandingPurchaseInvoice {

  sourceDocType: string;

  sourceDocId: string;

  sourceFormattedDocNo: string;

  invoiceDate?: string;

  supplier?: string;

  totalAmount: number;

  paidAmount: number;

  outstandingBalance: number;

}



export interface CreatePaymentVoucherInput {

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

  invoiceAllocations?: InvoiceAllocationInput[];

}



export async function fetchNextPaymentVoucherNo(): Promise<number | null> {

  try {

    const apiUp = await probeApiHealth();

    if (!apiUp) return null;

    const result = await apiFetch<{ voucherNo: number }>('/api/payment-vouchers/next-no');

    return result.voucherNo;

  } catch {

    return null;

  }

}



export async function fetchPaymentVoucherByNo(voucherNo: number): Promise<PaymentVoucherRecord> {

  return apiFetch<PaymentVoucherRecord>(`/api/payment-vouchers/by-no/${voucherNo}`);

}



export async function fetchOutstandingPurchaseInvoices(params: {

  supplier?: string;

  accountName?: string;

  accountCode?: string;

}): Promise<OutstandingPurchaseInvoice[]> {

  const query = new URLSearchParams();

  if (params.supplier) query.set('supplier', params.supplier);

  if (params.accountName) query.set('accountName', params.accountName);

  if (params.accountCode) query.set('accountCode', params.accountCode);

  const result = await apiFetch<{ items: OutstandingPurchaseInvoice[] }>(

    `/api/payment-vouchers/outstanding-purchase-invoices?${query.toString()}`,

  );

  return result.items ?? [];

}



export async function createPaymentVoucher(

  input: CreatePaymentVoucherInput,

): Promise<PaymentVoucherRecord> {

  return apiFetch<PaymentVoucherRecord>('/api/payment-vouchers', {

    method: 'POST',

    body: JSON.stringify({

      voucherType: 'payment',

      status: 'Posted',

      ...input,

    }),

  });

}



export async function updatePaymentVoucher(

  voucherNo: number,

  input: CreatePaymentVoucherInput,

): Promise<PaymentVoucherRecord> {

  return apiFetch<PaymentVoucherRecord>(`/api/payment-vouchers/by-no/${voucherNo}`, {

    method: 'PUT',

    body: JSON.stringify({

      voucherType: 'payment',

      status: 'Posted',

      ...input,

    }),

  });

}

