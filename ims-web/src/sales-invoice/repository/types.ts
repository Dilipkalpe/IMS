import type { TransactionListQueryBase } from '../../components/transaction/transactionListQuery';
import type { InvoicePaymentLink } from '../../types/invoicePaymentLink';
import type { SalesInvoiceHeader, SalesInvoiceLineItem } from '../types';

/** Persisted/API-shaped sales invoice (subset aligned with Mongo schema). */
export interface SalesInvoiceRecord {
  _id: string;
  docPrefix: string;
  docNo: number;
  formattedDocNo: string;
  customer: string;
  narration?: string;
  status: string;
  invoiceDate?: string;
  dueDate?: string;
  dcReference?: string;
  dcReferences?: DeliveryChallanDocReference[];
  gstin?: string;
  placeOfSupply?: string;
  ewayBillNo?: string;
  ewayBillDate?: string;
  vehicleNo?: string;
  transporter?: string;
  transporterId?: string;
  distanceKm?: number;
  paymentType?: string;
  paymentMode?: string;
  billAmount?: number;
  paidAmount?: number;
  balanceDue?: number;
  paymentLinks?: InvoicePaymentLink[];
  lines: SalesInvoiceApiLine[];
  totals?: Record<string, string | number>;
  createdAt?: string;
  updatedAt?: string;
}

export interface DeliveryChallanDocReference {
  docPrefix: string;
  docNo: number;
  formattedDocNo: string;
}

export interface SalesInvoiceApiLine {
  sr: number;
  productRetailCode?: string;
  itemDescription?: string;
  qty?: string | number;
  rate?: string | number;
  salesRate?: string | number;
  discPercent?: string | number;
  taxPercent?: string | number;
  taxType?: string;
  dcPrefix?: string;
  dcDocNo?: number;
  dcFormattedDocNo?: string;
  dcLineSr?: number;
  dcDeliveredQty?: string | number;
  dcPendingQty?: string | number;
}

export interface SalesInvoiceListQuery extends TransactionListQueryBase {}

export interface SalesInvoiceListResult {
  items: SalesInvoiceRecord[];
  total: number;
  page: number;
  limit: number;
}

export interface SalesInvoiceListStats {
  total: number;
  draft: number;
  posted: number;
  open?: number;
  active?: number;
}

export interface SalesInvoiceNextNo {
  docPrefix: string;
  docNo: number;
  formattedDocNo: string;
}

export interface SaveSalesInvoiceInput {
  /** Set when updating an existing document. */
  id?: string | null;
  header: SalesInvoiceHeader;
  lines: SalesInvoiceLineItem[];
  status?: string;
}

export interface SaveSalesInvoiceResult {
  record: SalesInvoiceRecord;
  created: boolean;
}

export interface SalesInvoiceRepository {
  readonly mode: 'http' | 'local';
  fetchList(query?: SalesInvoiceListQuery): Promise<SalesInvoiceListResult>;
  fetchStats(): Promise<SalesInvoiceListStats>;
  loadById(id: string): Promise<SalesInvoiceRecord>;
  loadByFormatted(formatted: string): Promise<SalesInvoiceRecord>;
  peekNextNo(prefix?: string): Promise<SalesInvoiceNextNo>;
  save(input: SaveSalesInvoiceInput): Promise<SaveSalesInvoiceResult>;
  deleteById(id: string): Promise<void>;
}
