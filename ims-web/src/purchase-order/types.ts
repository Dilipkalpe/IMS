import type { SalesInvoiceLineItem, SalesInvoiceTotals } from '../sales-invoice/types';

export type PurchaseOrderLineItem = SalesInvoiceLineItem;
export type PurchaseOrderTotals = SalesInvoiceTotals;

export interface PurchaseOrderHeader {
  entryDocPrefix: string;
  billNo: string;
  supplier: string;
  orderDate: string;
  paymentTerms: string;
  dueDate: string;
  companyGstin: string;
  supplierGstin: string;
  placeOfSupply: string;
  deliveryPriority: string;
  narration: string;
}

export interface PurchaseOrderListRow {
  id: string;
  billNo: string;
  date: string;
  supplier: string;
  amount: string;
  status: string;
}

export interface PurchaseOrderTab {
  id: string;
  title: string;
  isSelected: boolean;
}

export interface FieldError {
  field: string;
  message: string;
}
