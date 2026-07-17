/** WPF: InvoicePaymentFieldsMixin + InvoicePaymentSummarySupport (sales invoice). */

export const PAYMENT_TYPES = ['Credit', 'Cash', 'Partial'] as const;
export const PAYMENT_MODES = ['Cash', 'Bank', 'UPI', 'Cheque', 'Card'] as const;

export type PaymentTypeUi = (typeof PAYMENT_TYPES)[number];

export interface InvoicePaymentInput {
  paymentType: string;
  paidAmount: number;
}

export function normalizePaymentType(value?: string): 'credit' | 'cash' | 'partial' {
  const key = String(value ?? '').trim().toLowerCase();
  if (key === 'cash') return 'cash';
  if (key === 'partial') return 'partial';
  return 'credit';
}

export function displayPaymentType(apiValue?: string): PaymentTypeUi {
  switch (normalizePaymentType(apiValue)) {
    case 'cash':
      return 'Cash';
    case 'partial':
      return 'Partial';
    default:
      return 'Credit';
  }
}

export function normalizePaymentMode(value?: string): string {
  const key = String(value ?? '').trim().toLowerCase();
  if (key === 'cash') return 'cash';
  if (key === 'bank' || key.includes('bank')) return 'bank';
  if (key === 'upi') return 'upi';
  if (key === 'cheque') return 'cheque';
  if (key === 'card') return 'card';
  return '';
}

export function displayPaymentMode(apiValue?: string): string {
  const mode = normalizePaymentMode(apiValue);
  if (!mode) return '';
  return mode.charAt(0).toUpperCase() + mode.slice(1);
}

/** WPF: UiPaymentMode — credit keeps placeholder selected while combo is disabled. */
export function uiPaymentMode(paymentType: string, paymentMode?: string): string {
  if (normalizePaymentType(paymentType) === 'credit') return 'Cash';
  const displayed = displayPaymentMode(paymentMode);
  return displayed || 'Cash';
}

export function isPaymentModeEnabled(paymentType: string): boolean {
  return normalizePaymentType(paymentType) !== 'credit';
}

export function toApiPaymentType(ui: string): string {
  return normalizePaymentType(ui);
}

export function toApiPaymentMode(ui: string, paymentType: string): string {
  if (normalizePaymentType(paymentType) === 'credit') return '';
  return normalizePaymentMode(ui);
}

export function parseMoney(value: string | number | undefined): number {
  if (typeof value === 'number') return Number.isFinite(value) ? value : 0;
  const n = Number.parseFloat(String(value ?? '0').replace(/,/g, ''));
  return Number.isFinite(n) ? n : 0;
}

export function resolvePaymentAmounts(
  invoiceTotal: number,
  payment: InvoicePaymentInput,
): { paidAmount: number; balanceDue: number } {
  const bill = Math.max(0, invoiceTotal);
  const type = normalizePaymentType(payment.paymentType);

  if (type === 'cash') {
    return { paidAmount: bill, balanceDue: 0 };
  }

  if (type === 'partial') {
    const paid = Math.min(Math.max(0, payment.paidAmount), bill);
    return { paidAmount: paid, balanceDue: Math.max(0, bill - paid) };
  }

  return { paidAmount: 0, balanceDue: bill };
}

/** WPF: InvoicePaymentFieldsMixin.ResolveStatus — cash invoices save as paid. */
export function resolveSaveStatus(
  paymentType: string,
  invoiceTotal: number,
  balanceDue: number,
): 'paid' | 'open' {
  if (normalizePaymentType(paymentType) === 'cash') return 'paid';
  if (invoiceTotal > 0 && balanceDue <= 0.001) return 'paid';
  return 'open';
}

export function paymentModeToCashBank(paymentMode: string): 'CASH' | 'BANK' {
  const mode = normalizePaymentMode(paymentMode);
  return mode === 'bank' || mode === 'upi' || mode === 'cheque' || mode === 'card' ? 'BANK' : 'CASH';
}
