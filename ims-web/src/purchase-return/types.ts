import type { SalesInvoiceLineItem, SalesInvoiceTotals } from '../sales-invoice/types';

export type PurchaseReturnLineItem = SalesInvoiceLineItem;
export type PurchaseReturnTotals = SalesInvoiceTotals;

export interface PurchaseReturnHeader {
  entryDocPrefix: string;
  billNo: string;
  supplier: string;
  returnDate: string;
  invoiceReference: string;
  returnReason: string;
  returnWarehouse: string;
  companyGstin: string;
  supplierGstin: string;
  placeOfSupply: string;
  qcRemark: string;
  narration: string;
}

export interface PurchaseReturnListRow {
  id: string;
  billNo: string;
  date: string;
  supplier: string;
  amount: string;
  status: string;
}

export interface PurchaseReturnTab {
  id: string;
  title: string;
  isSelected: boolean;
}

export interface FieldError {
  field: string;
  message: string;
}
