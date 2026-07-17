import type { SalesInvoiceLineItem, SalesInvoiceTotals } from '../sales-invoice/types';

export interface GrnLineItem extends SalesInvoiceLineItem {
  poPrefix?: string;
  poDocNo?: number;
  poFormattedDocNo?: string;
  poLineSr?: number;
  poOrderedQty?: number;
  poPendingQty?: number;
}

export type GrnTotals = SalesInvoiceTotals;

export interface GrnHeader {
  entryDocPrefix: string;
  billNo: string;
  supplier: string;
  grnDate: string;
  poReference: string;
  warehouse: string;
  vehicleNo: string;
  transporter: string;
  buyer: string;
  companyGstin: string;
  supplierGstin: string;
  placeOfSupply: string;
  narration: string;
}

export interface GrnListRow {
  id: string;
  billNo: string;
  date: string;
  supplier: string;
  poReference: string;
  amount: string;
  status: string;
}

export interface GrnTab {
  id: string;
  title: string;
  isSelected: boolean;
}

export interface FieldError {
  field: string;
  message: string;
}
