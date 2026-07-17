import { applyLocalListQuery } from '../../components/transaction/localListQuery';
import { DEFAULT_LIST_PAGE_SIZE } from '../../components/transaction/transactionListQuery';
import { SAMPLE_LIST_ROWS, createSampleLines } from '../mockData';
import {
  buildSavePayload,
  recordToEditor,
  recordToHeader,
  recordToLines,
  recordToListRow,
} from './recordMappers';
import type {
  PurchaseInvoiceListQuery,
  PurchaseInvoiceListResult,
  PurchaseInvoiceListStats,
  PurchaseInvoiceNextNo,
  PurchaseInvoiceRecord,
  PurchaseInvoiceRepository,
  SavePurchaseInvoiceInput,
  SavePurchaseInvoiceResult,
} from './types';

const STORAGE_KEY = 'ims.purchaseInvoices.v1';

interface LocalStore {
  documents: PurchaseInvoiceRecord[];
  nextDocNo: number;
}

function seedDocuments(): PurchaseInvoiceRecord[] {
  return SAMPLE_LIST_ROWS.map((row, i) => {
    const match = row.billNo.match(/^([A-Z]+)-(\d+)$/i);
    const docPrefix = match?.[1]?.toUpperCase() ?? 'PI';
    const docNo = Number(match?.[2] ?? 800 + i);
    return {
      _id: row.id.startsWith('local-') ? row.id : `local-${row.id}`,
      docPrefix,
      docNo,
      formattedDocNo: row.billNo,
      supplier: row.supplier,
      status: row.status.toLowerCase() === 'draft' ? 'draft' : 'posted',
      invoiceDate: new Date().toISOString(),
      lines: createSampleLines(2).map((l, idx) => ({
        sr: idx + 1,
        productRetailCode: l.productRetailCode,
        itemDescription: l.itemDescription,
        qty: String(l.qty),
        rate: String(l.rate),
        salesRate: String(l.salesRate),
        discPercent: String(l.discPercent),
      })),
      billAmount: parseFloat(row.amount.replace(/,/g, '')) || 0,
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
  const nextDocNo = Math.max(...documents.map((d) => d.docNo), 842) + 1;
  return { documents, nextDocNo };
}

function saveStore(store: LocalStore): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
}

export class LocalPurchaseInvoiceRepository implements PurchaseInvoiceRepository {
  readonly mode = 'local' as const;
  private store = loadStore();

  private persist(): void {
    saveStore(this.store);
  }

  async fetchList(query: PurchaseInvoiceListQuery = {}): Promise<PurchaseInvoiceListResult> {
    const page = query.page ?? 1;
    const limit = query.limit ?? DEFAULT_LIST_PAGE_SIZE;
    const filtered = applyLocalListQuery(this.store.documents, query, {
      getPartyName: (d) => d.supplier,
      getDate: (d) => d.invoiceDate ?? d.createdAt ?? '',
      getAmount: (d) => String(d.billAmount ?? d.totals?.saleAmount ?? ''),
    });
    const total = filtered.length;
    const skip = (page - 1) * limit;
    return { items: filtered.slice(skip, skip + limit), total, page, limit };
  }

  async fetchStats(): Promise<PurchaseInvoiceListStats> {
    const docs = this.store.documents;
    const draft = docs.filter((d) => d.status === 'draft').length;
    const posted = docs.filter((d) => d.status === 'posted' || d.status === 'open').length;
    return { total: docs.length, draft, posted, active: draft + posted };
  }

  async loadById(id: string): Promise<PurchaseInvoiceRecord> {
    const item = this.store.documents.find((d) => d._id === id);
    if (!item) throw new Error('Purchase invoice not found.');
    return structuredClone(item);
  }

  async loadByFormatted(formatted: string): Promise<PurchaseInvoiceRecord> {
    const item = this.store.documents.find(
      (d) => d.formattedDocNo.toLowerCase() === formatted.trim().toLowerCase(),
    );
    if (!item) throw new Error('Purchase invoice not found.');
    return structuredClone(item);
  }

  async peekNextNo(prefix = 'PI'): Promise<PurchaseInvoiceNextNo> {
    const docPrefix = prefix.trim().toUpperCase() || 'PI';
    const docNo = this.store.nextDocNo;
    return { docPrefix, docNo, formattedDocNo: `${docPrefix}-${docNo}` };
  }

  async save(input: SavePurchaseInvoiceInput): Promise<SavePurchaseInvoiceResult> {
    const payload = buildSavePayload(input) as Partial<PurchaseInvoiceRecord>;
    const docPrefix = (payload.docPrefix as string) || 'PI';
    let docNo = Number(payload.docNo) || 0;

    if (input.id) {
      const idx = this.store.documents.findIndex((d) => d._id === input.id);
      if (idx < 0) throw new Error('Purchase invoice not found.');
      const existing = this.store.documents[idx];
      if (!docNo) docNo = existing.docNo;
      const updated: PurchaseInvoiceRecord = {
        ...existing,
        ...payload,
        _id: existing._id,
        docPrefix,
        docNo,
        formattedDocNo: `${docPrefix}-${docNo}`,
        lines: (payload.lines as PurchaseInvoiceRecord['lines']) ?? existing.lines,
        updatedAt: new Date().toISOString(),
      };
      this.store.documents[idx] = updated;
      this.persist();
      return { record: structuredClone(updated), created: false };
    }

    if (!docNo) {
      docNo = this.store.nextDocNo;
      this.store.nextDocNo += 1;
    } else if (docNo >= this.store.nextDocNo) {
      this.store.nextDocNo = docNo + 1;
    }

    const _id = `local-${crypto.randomUUID()}`;
    const created: PurchaseInvoiceRecord = {
      _id,
      docPrefix,
      docNo,
      formattedDocNo: `${docPrefix}-${docNo}`,
      supplier: input.header.supplier,
      narration: input.header.narration,
      status: (payload.status as string) ?? 'open',
      invoiceDate: (payload.invoiceDate as string) ?? new Date().toISOString(),
      dueDate: payload.dueDate as string | undefined,
      grnReference: input.header.grnReference,
      gstin: input.header.supplierGstin,
      placeOfSupply: input.header.placeOfSupply,
      paymentType: payload.paymentType as string,
      paymentMode: payload.paymentMode as string,
      billAmount: payload.billAmount as number,
      paidAmount: payload.paidAmount as number,
      balanceDue: payload.balanceDue as number,
      lines: payload.lines as PurchaseInvoiceRecord['lines'],
      totals: payload.totals as PurchaseInvoiceRecord['totals'],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    this.store.documents.push(created);
    this.persist();
    return { record: structuredClone(created), created: true };
  }

  async deleteById(id: string): Promise<void> {
    const before = this.store.documents.length;
    this.store.documents = this.store.documents.filter((d) => d._id !== id);
    if (this.store.documents.length === before) throw new Error('Purchase invoice not found.');
    this.persist();
  }
}

export function listRowsFromRecords(records: PurchaseInvoiceRecord[]) {
  return records.map(recordToListRow);
}

export { recordToEditor };
