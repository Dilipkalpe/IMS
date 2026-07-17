import { SAMPLE_LIST_ROWS, createSampleLines } from '../mockData';
import {
  buildSavePayload,
  recordToEditor,
  recordToHeader,
  recordToLines,
  recordToListRow,
} from './recordMappers';
import { applyLocalListQuery } from '../../components/transaction/localListQuery';
import { DEFAULT_LIST_PAGE_SIZE } from '../../components/transaction/transactionListQuery';
import type {
  PurchaseOrderListQuery,
  PurchaseOrderListResult,
  PurchaseOrderListStats,
  PurchaseOrderNextNo,
  PurchaseOrderRecord,
  PurchaseOrderRepository,
  SavePurchaseOrderInput,
  SavePurchaseOrderResult,
} from './types';

const STORAGE_KEY = 'ims.purchaseOrders.v1';

interface LocalStore {
  documents: PurchaseOrderRecord[];
  nextDocNo: number;
}

function seedDocuments(): PurchaseOrderRecord[] {
  return SAMPLE_LIST_ROWS.map((row, i) => {
    const match = row.billNo.match(/^([A-Z]+)-(\d+)$/i);
    const docPrefix = match?.[1]?.toUpperCase() ?? 'PO';
    const docNo = Number(match?.[2] ?? 1200 + i);
    return {
      _id: row.id.startsWith('local-') ? row.id : `local-${row.id}`,
      docPrefix,
      docNo,
      formattedDocNo: row.billNo,
      supplier: row.supplier,
      status: row.status.toLowerCase() === 'draft' ? 'draft' : 'open',
      poDate: new Date().toISOString(),
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

export class LocalPurchaseOrderRepository implements PurchaseOrderRepository {
  readonly mode = 'local' as const;
  private store = loadStore();

  async fetchList(query: PurchaseOrderListQuery = {}): Promise<PurchaseOrderListResult> {
    const page = query.page ?? 1;
    const limit = query.limit ?? DEFAULT_LIST_PAGE_SIZE;
    const filtered = applyLocalListQuery(this.store.documents, query, {
      getPartyName: (d) => d.supplier,
      getDate: (d) => d.poDate ?? d.billDate ?? d.createdAt ?? '',
      getAmount: (d) => String(d.orderAmount ?? d.totals?.saleAmount ?? ''),
    });
    const total = filtered.length;
    const skip = (page - 1) * limit;
    return { items: filtered.slice(skip, skip + limit), total, page, limit };
  }

  async fetchStats(): Promise<PurchaseOrderListStats> {
    const docs = this.store.documents;
    return {
      total: docs.length,
      draft: docs.filter((d) => d.status === 'draft').length,
      open: docs.filter((d) => d.status === 'open').length,
      confirmed: docs.filter((d) => d.status === 'confirmed' || d.status === 'dispatched').length,
    };
  }

  async loadById(id: string): Promise<PurchaseOrderRecord> {
    const item = this.store.documents.find((d) => d._id === id);
    if (!item) throw new Error('Purchase order not found.');
    return structuredClone(item);
  }

  async loadByFormatted(formatted: string): Promise<PurchaseOrderRecord> {
    const item = this.store.documents.find(
      (d) => d.formattedDocNo.toLowerCase() === formatted.trim().toLowerCase(),
    );
    if (!item) throw new Error('Purchase order not found.');
    return structuredClone(item);
  }

  async peekNextNo(prefix = 'PO'): Promise<PurchaseOrderNextNo> {
    const docPrefix = prefix.trim().toUpperCase() || 'PO';
    const docNo = this.store.nextDocNo;
    return { docPrefix, poPrefix: docPrefix, docNo, formattedDocNo: `${docPrefix}-${docNo}` };
  }

  async save(input: SavePurchaseOrderInput): Promise<SavePurchaseOrderResult> {
    const payload = buildSavePayload(input) as Partial<PurchaseOrderRecord>;
    const docPrefix = (payload.docPrefix as string) || 'PO';
    let docNo = Number(payload.docNo) || 0;

    if (input.id) {
      const idx = this.store.documents.findIndex((d) => d._id === input.id);
      if (idx < 0) throw new Error('Purchase order not found.');
      const existing = this.store.documents[idx];
      if (!docNo) docNo = existing.docNo;
      const updated: PurchaseOrderRecord = {
        ...existing,
        ...payload,
        _id: existing._id,
        docPrefix,
        docNo,
        formattedDocNo: `${docPrefix}-${docNo}`,
        lines: (payload.lines as PurchaseOrderRecord['lines']) ?? existing.lines,
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

    const created: PurchaseOrderRecord = {
      _id: `local-${crypto.randomUUID()}`,
      docPrefix,
      docNo,
      formattedDocNo: `${docPrefix}-${docNo}`,
      supplier: input.header.supplier,
      narration: input.header.narration,
      status: (payload.status as string) ?? 'open',
      poDate: (payload.poDate as string) ?? new Date().toISOString(),
      paymentTerms: input.header.paymentTerms,
      deliveryPriority: input.header.deliveryPriority,
      placeOfSupply: input.header.placeOfSupply,
      lines: payload.lines as PurchaseOrderRecord['lines'],
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
    if (this.store.documents.length === before) throw new Error('Purchase order not found.');
    saveStore(this.store);
  }
}

export function listRowsFromRecords(records: PurchaseOrderRecord[]) {
  return records.map(recordToListRow);
}

export { recordToEditor };
