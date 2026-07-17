export interface InvoicePaymentLink {
  voucherType: string;
  voucherNo: number;
  amount: number;
  voucherDate?: string;
  refNo?: string;
  cashBank?: string;
}
