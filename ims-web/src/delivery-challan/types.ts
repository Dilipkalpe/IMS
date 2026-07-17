import type { SalesInvoiceLineItem, SalesInvoiceTotals } from '../sales-invoice/types';

export interface DeliveryChallanLineItem extends SalesInvoiceLineItem {
  soPrefix?: string;
  soDocNo?: number;
  soFormattedDocNo?: string;
  soLineSr?: number;
  soOrderedQty?: number;
  soPendingQty?: number;
}

export type DeliveryChallanTotals = SalesInvoiceTotals;

export interface DeliveryChallanHeader {
  entryDocPrefix: string;
  billNo: string;
  customer: string;
  dcDate: string;
  soReference: string;
  warehouse: string;
  vehicleNo: string;
  transporter: string;
  salesMan: string;
  sellerGstin: string;
  customerGstin: string;
  placeOfSupply: string;
  narration: string;
}

export interface DeliveryChallanListRow {
  id: string;
  billNo: string;
  date: string;
  customer: string;
  soReference: string;
  amount: string;
  status: string;
}

export interface DeliveryChallanTab {
  id: string;
  title: string;
  isSelected: boolean;
}

export interface FieldError {
  field: string;
  message: string;
}
