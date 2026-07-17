import type { TransactionListQueryBase } from '../../components/transaction/transactionListQuery';
import type { SalesReturnHeader, SalesReturnLineItem } from '../types';

export interface SalesReturnRecord {
  _id: string;
  docPrefix: string;
  docNo: number;
  formattedDocNo: string;
  customer: string;
  narration?: string;
  status: string;
  returnDate?: string;
  billDate?: string;
  invoiceReference?: string;
  returnReason?: string;
  qcRemark?: string;
  returnWarehouse?: string;
  billingAddress?: string;
  shippingAddress?: string;
  placeOfSupply?: string;
  lines: SalesReturnApiLine[];
  totals?: Record<string, string | number>;
  orderAmount?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface SalesReturnApiLine {
  sr: number;
  productRetailCode?: string;
  itemDescription?: string;
  qty?: string | number;
  rate?: string | number;
  discPercent?: string | number;
  taxPercent?: string | number;
}

export interface SalesReturnListQuery extends TransactionListQueryBase {}

export interface SalesReturnListResult {
  items: SalesReturnRecord[];
  total: number;
  page: number;
  limit: number;
}

export interface SalesReturnListStats {
  total: number;
  draft: number;
  open: number;
  confirmed: number;
}

export interface SalesReturnNextNo {
  docPrefix: string;
  docNo: number;
  formattedDocNo: string;
}

export interface SaveSalesReturnInput {
  id?: string | null;
  header: SalesReturnHeader;
  lines: SalesReturnLineItem[];
  status?: string;
}

export interface SaveSalesReturnResult {
  record: SalesReturnRecord;
  created: boolean;
}

export interface SalesReturnRepository {
  readonly mode: 'http' | 'local';
  fetchList(query?: SalesReturnListQuery): Promise<SalesReturnListResult>;
  fetchStats(): Promise<SalesReturnListStats>;
  loadById(id: string): Promise<SalesReturnRecord>;
  loadByFormatted(formatted: string): Promise<SalesReturnRecord>;
  peekNextNo(prefix?: string): Promise<SalesReturnNextNo>;
  save(input: SaveSalesReturnInput): Promise<SaveSalesReturnResult>;
  deleteById(id: string): Promise<void>;
}
