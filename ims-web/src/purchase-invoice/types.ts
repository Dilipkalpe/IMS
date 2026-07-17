import type { SalesInvoiceLineItem, SalesInvoiceTotals } from '../sales-invoice/types';

/** Line/totals math shared with Sales Invoice (GST layer). */
export type PurchaseInvoiceLineItem = SalesInvoiceLineItem;
export type PurchaseInvoiceTotals = SalesInvoiceTotals;

export interface PurchaseInvoiceHeader {
  entryDocPrefix: string;
  billNo: string;
  supplier: string;
  invoiceDate: string;
  grnReference: string;
  dueDate: string;
  companyGstin: string;
  supplierGstin: string;
  placeOfSupply: string;
  paymentType: string;
  paymentMode: string;
  paidAmount: number;
  narration: string;
}

export interface PurchaseInvoiceListRow {
  id: string;
  billNo: string;
  date: string;
  supplier: string;
  amount: string;
  status: string;
}

export interface PurchaseInvoiceTab {
  id: string;
  title: string;
  isSelected: boolean;
}

export interface FieldError {
  field: string;
  message: string;
}
