import type { TransactionListQueryBase } from '../../components/transaction/transactionListQuery';
import type { InvoicePaymentLink } from '../../types/invoicePaymentLink';
import type { PurchaseInvoiceHeader, PurchaseInvoiceLineItem } from '../types';

export interface PurchaseInvoiceRecord {
  _id: string;
  docPrefix: string;
  docNo: number;
  formattedDocNo: string;
  supplier: string;
  narration?: string;
  status: string;
  invoiceDate?: string;
  dueDate?: string;
  grnReference?: string;
  gstin?: string;
  placeOfSupply?: string;
  paymentType?: string;
  paymentMode?: string;
  billAmount?: number;
  paidAmount?: number;
  balanceDue?: number;
  paymentLinks?: InvoicePaymentLink[];
  lines: PurchaseInvoiceApiLine[];
  totals?: Record<string, string | number>;
  createdAt?: string;
  updatedAt?: string;
}

export interface PurchaseInvoiceApiLine {
  sr: number;
  productRetailCode?: string;
  itemDescription?: string;
  qty?: string | number;
  rate?: string | number;
  salesRate?: string | number;
  discPercent?: string | number;
  taxPercent?: string | number;
  taxType?: string;
}

export interface PurchaseInvoiceListQuery extends TransactionListQueryBase {}

export interface PurchaseInvoiceListResult {
  items: PurchaseInvoiceRecord[];
  total: number;
  page: number;
  limit: number;
}

export interface PurchaseInvoiceListStats {
  total: number;
  draft: number;
  posted: number;
  open?: number;
  active?: number;
}

export interface PurchaseInvoiceNextNo {
  docPrefix: string;
  docNo: number;
  formattedDocNo: string;
}

export interface SavePurchaseInvoiceInput {
  id?: string | null;
  header: PurchaseInvoiceHeader;
  lines: PurchaseInvoiceLineItem[];
  status?: string;
}

export interface SavePurchaseInvoiceResult {
  record: PurchaseInvoiceRecord;
  created: boolean;
}

export interface PurchaseInvoiceRepository {
  readonly mode: 'http' | 'local';
  fetchList(query?: PurchaseInvoiceListQuery): Promise<PurchaseInvoiceListResult>;
  fetchStats(): Promise<PurchaseInvoiceListStats>;
  loadById(id: string): Promise<PurchaseInvoiceRecord>;
  loadByFormatted(formatted: string): Promise<PurchaseInvoiceRecord>;
  peekNextNo(prefix?: string): Promise<PurchaseInvoiceNextNo>;
  save(input: SavePurchaseInvoiceInput): Promise<SavePurchaseInvoiceResult>;
  deleteById(id: string): Promise<void>;
}
