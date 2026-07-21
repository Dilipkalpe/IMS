import { applyLocalListQuery } from '../../components/transaction/localListQuery';
import { DEFAULT_LIST_PAGE_SIZE } from '../../components/transaction/transactionListQuery';
import { SAMPLE_LIST_ROWS, createSampleLines } from '../mockData';
import { parseFormattedSoNo } from '../soDocumentNo';
import {
  buildSavePayload,
  recordToEditor,
  recordToHeader,
  recordToLines,
  recordToListRow,
} from './recordMappers';
import type {
  SalesOrderListQuery,
  SalesOrderListResult,
  SalesOrderListStats,
  SalesOrderNextNo,
  SalesOrderRecord,
  SalesOrderRepository,
  SaveSalesOrderInput,
  SaveSalesOrderResult,
} from './types';

const STORAGE_KEY = 'ims.salesOrders.v1';

interface LocalStore {
  documents: SalesOrderRecord[];
  nextDocNo: number;
}

function seedDocuments(): SalesOrderRecord[] {
  return SAMPLE_LIST_ROWS.map((row, i) => {
    const match = row.billNo.match(/^([A-Z]+)-(\d+)$/i);
    const soPrefix = match?.[1]?.toUpperCase() ?? 'SO';
    const docNo = Number(match?.[2] ?? 1200 + i);
    return {
      _id: row.id.startsWith('local-') ? row.id : `local-${row.id}`,
      soPrefix,
      docNo,
      formattedDocNo: row.billNo,
      customer: row.customer,
      status: row.status.toLowerCase() === 'draft' ? 'draft' : 'open',
      soDate: new Date().toISOString(),
      placeOfSupply: '24-Gujarat',
      lines: createSampleLines(2).map((l, idx) => ({
        sr: idx + 1,
        productRetailCode: l.productRetailCode,
        itemDescription: l.itemDescription,
        qty: String(l.qty),
        rate: String(l.rate),
        discPercent: String(l.discPercent),
      })),
      orderAmount: parseFloat(row.amount.replace(/,/g, '')) || 0,
    };
  });
}

function loadStore(): LocalStore {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as LocalStore;
      if (Array.isArray(parsed.documents)) return parsed;
    }
  } catch {
    /* ignore */
  }
  const documents = seedDocuments();
  return { documents, nextDocNo: Math.max(...documents.map((d) => d.docNo), 1205) + 1 };
}

function saveStore(store: LocalStore): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
}

export class LocalSalesOrderRepository implements SalesOrderRepository {
  readonly mode = 'local' as const;
  private store = loadStore();

  async fetchList(query: SalesOrderListQuery = {}): Promise<SalesOrderListResult> {
    const page = query.page ?? 1;
    const limit = query.limit ?? DEFAULT_LIST_PAGE_SIZE;
    const filtered = applyLocalListQuery(this.store.documents, query, {
      getDate: (d) => d.soDate ?? d.billDate ?? d.createdAt ?? '',
      getAmount: (d) => String(d.orderAmount ?? d.totals?.saleAmount ?? ''),
    });
    const total = filtered.length;
    const skip = (page - 1) * limit;
    return { items: filtered.slice(skip, skip + limit), total, page, limit };
  }

  async fetchStats(): Promise<SalesOrderListStats> {
    const docs = this.store.documents;
    const draft = docs.filter((d) => d.status === 'draft').length;
    const confirmed = docs.filter((d) => d.status === 'confirmed').length;
    const picking = docs.filter((d) => d.status === 'picking').length;
    return {
      total: docs.length,
      draft,
      open: docs.filter((d) => d.status === 'open').length,
      confirmed,
      picking,
      toShip: confirmed + picking + draft,
      shipped: docs.filter((d) => d.status === 'shipped').length,
      cancelled: docs.filter((d) => d.status === 'cancelled').length,
    };
  }

  async loadById(id: string): Promise<SalesOrderRecord> {
    const item = this.store.documents.find((d) => d._id === id);
    if (!item) throw new Error('Sales order not found.');
    return structuredClone(item);
  }

  async loadByFormatted(formatted: string): Promise<SalesOrderRecord> {
    const item = this.store.documents.find(
      (d) => d.formattedDocNo.toLowerCase() === formatted.trim().toLowerCase(),
    );
    if (!item) throw new Error('Sales order not found.');
    return structuredClone(item);
  }

  async peekNextNo(prefix = 'SO'): Promise<SalesOrderNextNo> {
    const soPrefix = prefix.trim().toUpperCase() || 'SO';
    const docNo = this.store.nextDocNo;
    return { soPrefix, docNo, formattedDocNo: `${soPrefix}-${docNo}` };
  }

  async save(input: SaveSalesOrderInput): Promise<SaveSalesOrderResult> {
    const payload = buildSavePayload(input) as Partial<SalesOrderRecord>;
    const soPrefix = (payload.soPrefix as string) || 'SO';
    let docNo = Number(payload.docNo) || 0;

    if (input.id) {
      const idx = this.store.documents.findIndex((d) => d._id === input.id);
      if (idx < 0) throw new Error('Sales order not found.');
      const existing = this.store.documents[idx];
      if (!docNo) docNo = existing.docNo;
      const updated: SalesOrderRecord = {
        ...existing,
        ...payload,
        _id: existing._id,
        soPrefix,
        docNo,
        formattedDocNo: `${soPrefix}-${docNo}`,
        lines: (payload.lines as SalesOrderRecord['lines']) ?? existing.lines,
        updatedAt: new Date().toISOString(),
      };
      this.store.documents[idx] = updated;
      saveStore(this.store);
      return { record: structuredClone(updated), created: false };
    }

    if (!docNo) {
      docNo = this.store.nextDocNo++;
    } else if (docNo >= this.store.nextDocNo) {
      this.store.nextDocNo = docNo + 1;
    }

    const created: SalesOrderRecord = {
      _id: `local-${crypto.randomUUID()}`,
      soPrefix,
      docNo,
      formattedDocNo: `${soPrefix}-${docNo}`,
      customer: input.header.customer,
      narration: input.header.narration,
      status: (payload.status as string) ?? 'open',
      soDate: (payload.soDate as string) ?? new Date().toISOString(),
      paymentTerms: input.header.paymentTerms,
      deliveryPriority: input.header.deliveryPriority,
      placeOfSupply: input.header.placeOfSupply,
      lines: payload.lines as SalesOrderRecord['lines'],
      orderAmount: payload.orderAmount as number,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    this.store.documents.push(created);
    saveStore(this.store);
    return { record: structuredClone(created), created: true };
  }

  async deleteById(id: string): Promise<void> {
    const before = this.store.documents.length;
    this.store.documents = this.store.documents.filter((d) => d._id !== id);
    if (this.store.documents.length === before) throw new Error('Sales order not found.');
    saveStore(this.store);
  }

  async deleteByBillNo(billNo: string): Promise<void> {
    const parsed = parseFormattedSoNo(billNo);
    if (!parsed) throw new Error('Invalid sales order number.');
    const before = this.store.documents.length;
    this.store.documents = this.store.documents.filter(
      (d) => !(d.soPrefix === parsed.prefix && d.docNo === parsed.docNo),
    );
    if (this.store.documents.length === before) throw new Error('Sales order not found.');
    saveStore(this.store);
  }
}

export function listRowsFromRecords(records: SalesOrderRecord[]) {
  return records.map(recordToListRow);
}

export { recordToEditor };
