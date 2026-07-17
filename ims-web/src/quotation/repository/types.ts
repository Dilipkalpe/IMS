import type { TransactionListQueryBase } from '../../components/transaction/transactionListQuery';
import type { QuotationHeader, QuotationLineItem } from '../types';

export interface QuotationRecord {
  _id: string;
  qtPrefix: string;
  docNo: number;
  formattedDocNo: string;
  customer: string;
  narration?: string;
  status: string;
  quoteDate?: string;
  billDate?: string;
  paymentTerms?: string;
  validUntil?: string;
  billingAddress?: string;
  shippingAddress?: string;
  placeOfSupply?: string;
  lines: QuotationApiLine[];
  totals?: Record<string, string | number>;
  orderAmount?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface QuotationApiLine {
  sr: number;
  productRetailCode?: string;
  itemDescription?: string;
  qty?: string | number;
  rate?: string | number;
  discPercent?: string | number;
  taxPercent?: string | number;
}

export interface QuotationListQuery extends TransactionListQueryBase {}

export interface QuotationListResult {
  items: QuotationRecord[];
  total: number;
  page: number;
  limit: number;
}

export interface QuotationListStats {
  total: number;
  draft: number;
  open: number;
  confirmed: number;
}

export interface QuotationNextNo {
  qtPrefix: string;
  docNo: number;
  formattedDocNo: string;
}

export interface SaveQuotationInput {
  id?: string | null;
  header: QuotationHeader;
  lines: QuotationLineItem[];
  status?: string;
}

export interface SaveQuotationResult {
  record: QuotationRecord;
  created: boolean;
}

export interface QuotationRepository {
  readonly mode: 'http' | 'local';
  fetchList(query?: QuotationListQuery): Promise<QuotationListResult>;
  fetchStats(): Promise<QuotationListStats>;
  loadById(id: string): Promise<QuotationRecord>;
  loadByFormatted(formatted: string): Promise<QuotationRecord>;
  peekNextNo(prefix?: string): Promise<QuotationNextNo>;
  save(input: SaveQuotationInput): Promise<SaveQuotationResult>;
  deleteById(id: string): Promise<void>;
}
