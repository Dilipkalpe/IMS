import type { TransactionListQueryBase } from '../../components/transaction/transactionListQuery';
import type { PurchaseReturnHeader, PurchaseReturnLineItem } from '../types';

export interface PurchaseReturnRecord {
  _id: string;
  docPrefix: string;
  docNo: number;
  formattedDocNo: string;
  supplier: string;
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
  lines: PurchaseReturnApiLine[];
  totals?: Record<string, string | number>;
  orderAmount?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface PurchaseReturnApiLine {
  sr: number;
  productRetailCode?: string;
  itemDescription?: string;
  qty?: string | number;
  rate?: string | number;
  discPercent?: string | number;
  taxPercent?: string | number;
}

export interface PurchaseReturnListQuery extends TransactionListQueryBase {}

export interface PurchaseReturnListResult {
  items: PurchaseReturnRecord[];
  total: number;
  page: number;
  limit: number;
}

export interface PurchaseReturnListStats {
  total: number;
  draft: number;
  open: number;
  confirmed: number;
}

export interface PurchaseReturnNextNo {
  docPrefix: string;
  docNo: number;
  formattedDocNo: string;
}

export interface SavePurchaseReturnInput {
  id?: string | null;
  header: PurchaseReturnHeader;
  lines: PurchaseReturnLineItem[];
  status?: string;
}

export interface SavePurchaseReturnResult {
  record: PurchaseReturnRecord;
  created: boolean;
}

export interface PurchaseReturnRepository {
  readonly mode: 'http' | 'local';
  fetchList(query?: PurchaseReturnListQuery): Promise<PurchaseReturnListResult>;
  fetchStats(): Promise<PurchaseReturnListStats>;
  loadById(id: string): Promise<PurchaseReturnRecord>;
  loadByFormatted(formatted: string): Promise<PurchaseReturnRecord>;
  peekNextNo(prefix?: string): Promise<PurchaseReturnNextNo>;
  save(input: SavePurchaseReturnInput): Promise<SavePurchaseReturnResult>;
  deleteById(id: string): Promise<void>;
}
