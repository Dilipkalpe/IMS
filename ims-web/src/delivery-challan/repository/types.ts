import type { TransactionListQueryBase } from '../../components/transaction/transactionListQuery';
import type { DeliveryChallanHeader, DeliveryChallanLineItem } from '../types';

export interface DeliveryChallanRecord {
  _id: string;
  docPrefix: string;
  docNo: number;
  formattedDocNo: string;
  customer: string;
  salesMan?: string;
  narration?: string;
  status: string;
  dcDate?: string;
  billDate?: string;
  warehouse?: string;
  vehicleNo?: string;
  transporter?: string;
  soReference?: string;
  soReferences?: SalesOrderDocReference[];
  billingAddress?: string;
  shipToAddress?: string;
  placeOfSupply?: string;
  lines: DeliveryChallanApiLine[];
  totals?: Record<string, string | number>;
  orderAmount?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface SalesOrderDocReference {
  soPrefix: string;
  docNo: number;
  formattedDocNo: string;
}

export interface DeliveryChallanApiLine {
  sr: number;
  productRetailCode?: string;
  itemDescription?: string;
  qty?: string | number;
  rate?: string | number;
  salesRate?: string | number;
  discPercent?: string | number;
  taxPercent?: string | number;
  soPrefix?: string;
  soDocNo?: number;
  soFormattedDocNo?: string;
  soLineSr?: number;
  soOrderedQty?: string | number;
  soPendingQty?: string | number;
}

export interface DeliveryChallanListQuery extends TransactionListQueryBase {}

export interface DeliveryChallanListResult {
  items: DeliveryChallanRecord[];
  total: number;
  page: number;
  limit: number;
}

export interface DeliveryChallanListStats {
  total: number;
  draft: number;
  open: number;
  posted: number;
}

export interface DeliveryChallanNextNo {
  docPrefix: string;
  soPrefix?: string;
  deliveryChallanPrefix?: string;
  docNo: number;
  formattedDocNo: string;
}

export interface SaveDeliveryChallanInput {
  id?: string | null;
  header: DeliveryChallanHeader;
  lines: DeliveryChallanLineItem[];
  status?: string;
}

export interface SaveDeliveryChallanResult {
  record: DeliveryChallanRecord;
  created: boolean;
}

export interface DeliveryChallanRepository {
  readonly mode: 'http' | 'local';
  fetchList(query?: DeliveryChallanListQuery): Promise<DeliveryChallanListResult>;
  fetchStats(): Promise<DeliveryChallanListStats>;
  loadById(id: string): Promise<DeliveryChallanRecord>;
  loadByFormatted(formatted: string): Promise<DeliveryChallanRecord>;
  peekNextNo(prefix?: string): Promise<DeliveryChallanNextNo>;
  save(input: SaveDeliveryChallanInput): Promise<SaveDeliveryChallanResult>;
  deleteById(id: string): Promise<void>;
}
