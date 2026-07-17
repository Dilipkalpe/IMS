import type { TransactionListQueryBase } from '../../components/transaction/transactionListQuery';
import type { GrnHeader, GrnLineItem } from '../types';

export interface GrnRecord {
  _id: string;
  docPrefix: string;
  docNo: number;
  formattedDocNo: string;
  supplier: string;
  buyer?: string;
  narration?: string;
  status: string;
  grnDate?: string;
  billDate?: string;
  warehouse?: string;
  vehicleNo?: string;
  transporter?: string;
  poReference?: string;
  billingAddress?: string;
  shipToAddress?: string;
  placeOfSupply?: string;
  lines: GrnApiLine[];
  totals?: Record<string, string | number>;
  orderAmount?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface GrnApiLine {
  sr: number;
  productRetailCode?: string;
  itemDescription?: string;
  qty?: string | number;
  rate?: string | number;
  salesRate?: string | number;
  discPercent?: string | number;
  taxPercent?: string | number;
  poPrefix?: string;
  poDocNo?: number;
  poFormattedDocNo?: string;
  poLineSr?: number;
  poOrderedQty?: string | number;
  poPendingQty?: string | number;
}

export interface GrnListQuery extends TransactionListQueryBase {}

export interface GrnListResult {
  items: GrnRecord[];
  total: number;
  page: number;
  limit: number;
}

export interface GrnListStats {
  total: number;
  draft: number;
  open: number;
  posted: number;
}

export interface GrnNextNo {
  docPrefix: string;
  poPrefix?: string;
  grnPrefix?: string;
  docNo: number;
  formattedDocNo: string;
}

export interface SaveGrnInput {
  id?: string | null;
  header: GrnHeader;
  lines: GrnLineItem[];
  status?: string;
}

export interface SaveGrnResult {
  record: GrnRecord;
  created: boolean;
}

export interface GrnRepository {
  readonly mode: 'http' | 'local';
  fetchList(query?: GrnListQuery): Promise<GrnListResult>;
  fetchStats(): Promise<GrnListStats>;
  loadById(id: string): Promise<GrnRecord>;
  loadByFormatted(formatted: string): Promise<GrnRecord>;
  peekNextNo(prefix?: string): Promise<GrnNextNo>;
  save(input: SaveGrnInput): Promise<SaveGrnResult>;
  deleteById(id: string): Promise<void>;
}
