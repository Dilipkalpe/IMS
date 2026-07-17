import type { TransactionListQueryBase } from '../../components/transaction/transactionListQuery';
import type { PurchaseOrderHeader, PurchaseOrderLineItem } from '../types';

export interface PurchaseOrderRecord {
  _id: string;
  docPrefix: string;
  docNo: number;
  formattedDocNo: string;
  supplier: string;
  buyer?: string;
  narration?: string;
  status: string;
  poDate?: string;
  billDate?: string;
  paymentTerms?: string;
  deliveryPriority?: string;
  billingAddress?: string;
  shipToAddress?: string;
  placeOfSupply?: string;
  lines: PurchaseOrderApiLine[];
  totals?: Record<string, string | number>;
  orderAmount?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface PurchaseOrderApiLine {
  sr: number;
  productRetailCode?: string;
  itemDescription?: string;
  qty?: string | number;
  rate?: string | number;
  salesRate?: string | number;
  discPercent?: string | number;
  taxPercent?: string | number;
  receivedQty?: string | number;
}

export interface PurchaseOrderListQuery extends TransactionListQueryBase {}

export interface PurchaseOrderListResult {
  items: PurchaseOrderRecord[];
  total: number;
  page: number;
  limit: number;
}

export interface PurchaseOrderListStats {
  total: number;
  draft: number;
  open: number;
  confirmed: number;
}

export interface PurchaseOrderNextNo {
  docPrefix: string;
  poPrefix: string;
  docNo: number;
  formattedDocNo: string;
}

export interface SavePurchaseOrderInput {
  id?: string | null;
  header: PurchaseOrderHeader;
  lines: PurchaseOrderLineItem[];
  status?: string;
}

export interface SavePurchaseOrderResult {
  record: PurchaseOrderRecord;
  created: boolean;
}

export interface PurchaseOrderRepository {
  readonly mode: 'http' | 'local';
  fetchList(query?: PurchaseOrderListQuery): Promise<PurchaseOrderListResult>;
  fetchStats(): Promise<PurchaseOrderListStats>;
  loadById(id: string): Promise<PurchaseOrderRecord>;
  loadByFormatted(formatted: string): Promise<PurchaseOrderRecord>;
  peekNextNo(prefix?: string): Promise<PurchaseOrderNextNo>;
  save(input: SavePurchaseOrderInput): Promise<SavePurchaseOrderResult>;
  deleteById(id: string): Promise<void>;
}
