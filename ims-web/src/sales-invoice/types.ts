export interface SalesInvoiceLineItem {
  id: string;
  sr: number;
  productRetailCode: string;
  itemDescription: string;
  /** On-hand stock snapshot when product was added (purchase modules). */
  balStk?: number;
  qty: number;
  rate: number;
  salesRate: number;
  discPercent: number;
  cgstPercent: number;
  sgstPercent: number;
  igstPercent: number;
  dcPrefix?: string;
  dcDocNo?: number;
  dcFormattedDocNo?: string;
  dcLineSr?: number;
  dcDeliveredQty?: number;
  dcPendingQty?: number;
}

export interface SalesInvoiceLineComputed {
  taxable: number;
  cgstAmount: number;
  sgstAmount: number;
  igstAmount: number;
  lineTotal: number;
}

export interface SalesInvoiceHeader {
  entryDocPrefix: string;
  billNo: string;
  customer: string;
  invoiceDate: string;
  dcReference: string;
  dueDate: string;
  sellerGstin: string;
  customerGstin: string;
  placeOfSupply: string;
  paymentType: string;
  paymentMode: string;
  /** Used when paymentType is Partial; cash/credit amounts are derived at totals time. */
  paidAmount: number;
  narration: string;
  ewayBillNo: string;
  ewayBillDate: string;
  vehicleNo: string;
  transporter: string;
  transporterId: string;
  /** Distance in km for e-way bill; empty string when not set. */
  distanceKm: string;
}

export interface SalesInvoiceTotals {
  totalTaxable: number;
  totalCgst: number;
  totalSgst: number;
  totalIgst: number;
  totalDiscount: number;
  invoiceTotal: number;
  paidAmount: number;
  balanceDue: number;
  roundOff: number;
}

export interface SalesInvoiceListRow {
  id: string;
  billNo: string;
  date: string;
  customer: string;
  amount: string;
  status: string;
}

export interface SalesInvoiceTab {
  id: string;
  title: string;
  isSelected: boolean;
}

export interface FieldError {
  field: string;
  message: string;
}
