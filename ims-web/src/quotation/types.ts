import type { SalesInvoiceLineItem, SalesInvoiceTotals } from '../sales-invoice/types';

export type QuotationLineItem = SalesInvoiceLineItem;
export type QuotationTotals = SalesInvoiceTotals;

export interface QuotationHeader {
  entryDocPrefix: string;
  billNo: string;
  customer: string;
  quoteDate: string;
  paymentTerms: string;
  sellerGstin: string;
  customerGstin: string;
  placeOfSupply: string;
  validUntil: string;
  narration: string;
}

export interface QuotationListRow {
  id: string;
  billNo: string;
  date: string;
  customer: string;
  amount: string;
  status: string;
}

export interface QuotationTab {
  id: string;
  title: string;
  isSelected: boolean;
}

export interface FieldError {
  field: string;
  message: string;
}
