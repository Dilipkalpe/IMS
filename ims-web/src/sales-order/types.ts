import type { SalesInvoiceLineItem, SalesInvoiceTotals } from '../sales-invoice/types';

export type SalesOrderLineItem = SalesInvoiceLineItem;
export type SalesOrderTotals = SalesInvoiceTotals;

export type SalesOrderStatus = 'draft' | 'open' | 'confirmed' | 'picking' | 'shipped' | 'closed' | 'cancelled';

export interface SalesOrderHeader {
  entryDocPrefix: string;
  billNo: string;
  customer: string;
  salesMan: string;
  orderDate: string;
  paymentTerms: string;
  dueDate: string;
  billingAddress: string;
  shippingAddress: string;
  sellerGstin: string;
  customerGstin: string;
  placeOfSupply: string;
  deliveryPriority: string;
  status: SalesOrderStatus;
  narration: string;
}

export interface SalesOrderListRow {
  id: string;
  billNo: string;
  date: string;
  customer: string;
  amount: string;
  status: string;
}

export interface SalesOrderTab {
  id: string;
  title: string;
  isSelected: boolean;
}

export interface FieldError {
  field: string;
  message: string;
}
