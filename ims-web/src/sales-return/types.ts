import type { SalesInvoiceLineItem, SalesInvoiceTotals } from '../sales-invoice/types';

export type SalesReturnLineItem = SalesInvoiceLineItem;
export type SalesReturnTotals = SalesInvoiceTotals;

export interface SalesReturnHeader {
  entryDocPrefix: string;
  billNo: string;
  customer: string;
  returnDate: string;
  invoiceReference: string;
  returnReason: string;
  returnWarehouse: string;
  sellerGstin: string;
  customerGstin: string;
  placeOfSupply: string;
  qcRemark: string;
  narration: string;
}

export interface SalesReturnListRow {
  id: string;
  billNo: string;
  date: string;
  customer: string;
  amount: string;
  status: string;
}

export interface SalesReturnTab {
  id: string;
  title: string;
  isSelected: boolean;
}

export interface FieldError {
  field: string;
  message: string;
}
