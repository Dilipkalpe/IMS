import type { TransactionListQueryBase } from '../../components/transaction/transactionListQuery';
import type { SalesOrderHeader, SalesOrderLineItem } from '../types';

export interface SalesOrderRecord {
  _id: string;
  soPrefix: string;
  docNo: number;
  formattedDocNo: string;
  customer: string;
  salesMan?: string;
  narration?: string;
  status: string;
  soDate?: string;
  billDate?: string;
  paymentTerms?: string;
  deliveryPriority?: string;
  billingAddress?: string;
  shippingAddress?: string;
  placeOfSupply?: string;
  lines: SalesOrderApiLine[];
  totals?: Record<string, string | number>;
  orderAmount?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface SalesOrderApiLine {
  sr: number;
  productRetailCode?: string;
  itemDescription?: string;
  qty?: string | number;
  rate?: string | number;
  discPercent?: string | number;
  discValue?: string | number;
  taxPercent?: string | number;
  taxType?: string;
  amount?: string | number;
}

export interface SalesOrderListQuery extends TransactionListQueryBase {}

export interface SalesOrderListResult {
  items: SalesOrderRecord[];
  total: number;
  page: number;
  limit: number;
}

export interface SalesOrderListStats {
  total: number;
  draft: number;
  open: number;
  confirmed: number;
  toShip?: number;
  shipped?: number;
  cancelled?: number;
}

export interface SalesOrderNextNo {
  soPrefix: string;
  docNo: number;
  formattedDocNo: string;
}

export interface SaveSalesOrderInput {
  id?: string | null;
  header: SalesOrderHeader;
  lines: SalesOrderLineItem[];
  status?: string;
}

export interface SaveSalesOrderResult {
  record: SalesOrderRecord;
  created: boolean;
}

export interface SalesOrderRepository {
  readonly mode: 'http' | 'local';
  fetchList(query?: SalesOrderListQuery): Promise<SalesOrderListResult>;
  fetchStats(): Promise<SalesOrderListStats>;
  loadById(id: string): Promise<SalesOrderRecord>;
  loadByFormatted(formatted: string): Promise<SalesOrderRecord>;
  peekNextNo(prefix?: string): Promise<SalesOrderNextNo>;
  save(input: SaveSalesOrderInput): Promise<SaveSalesOrderResult>;
  deleteById(id: string): Promise<void>;
  deleteByBillNo?(billNo: string): Promise<void>;
}
