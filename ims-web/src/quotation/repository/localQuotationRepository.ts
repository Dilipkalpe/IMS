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
  QuotationListQuery,
  QuotationListResult,
  QuotationListStats,
  QuotationNextNo,
  QuotationRecord,
  QuotationRepository,
  SaveQuotationInput,
  SaveQuotationResult,
} from './types';

const STORAGE_KEY = 'ims.quotations.v1';

interface LocalStore {
  documents: QuotationRecord[];
  nextDocNo: number;
}

function seedDocuments(): QuotationRecord[] {
  return SAMPLE_LIST_ROWS.map((row, i) => {
    const match = row.billNo.match(/^([A-Z]+)-(\d+)$/i);
    const qtPrefix = match?.[1]?.toUpperCase() ?? 'QT';
    const docNo = Number(match?.[2] ?? 1200 + i);
    return {
      _id: row.id.startsWith('local-') ? row.id : `local-${row.id}`,
      qtPrefix,
      docNo,
      formattedDocNo: row.billNo,
      customer: row.customer,
      status: row.status.toLowerCase() === 'draft' ? 'draft' : 'open',
      quoteDate: new Date().toISOString(),
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

export class LocalQuotationRepository implements QuotationRepository {
  readonly mode = 'local' as const;
  private store = loadStore();

  async fetchList(query: QuotationListQuery = {}): Promise<QuotationListResult> {
    const page = query.page ?? 1;
    const limit = query.limit ?? DEFAULT_LIST_PAGE_SIZE;
    const filtered = applyLocalListQuery(this.store.documents, query, {
      getDate: (d) => d.quoteDate ?? d.billDate ?? d.createdAt ?? '',
      getAmount: (d) => String(d.orderAmount ?? d.totals?.saleAmount ?? ''),
    });
    const total = filtered.length;
    const skip = (page - 1) * limit;
    return { items: filtered.slice(skip, skip + limit), total, page, limit };
  }

  async fetchStats(): Promise<QuotationListStats> {
    const docs = this.store.documents;
    return {
      total: docs.length,
      draft: docs.filter((d) => d.status === 'draft').length,
      open: docs.filter((d) => d.status === 'open').length,
      confirmed: docs.filter((d) => d.status === 'confirmed').length,
    };
  }

  async loadById(id: string): Promise<QuotationRecord> {
    const item = this.store.documents.find((d) => d._id === id);
    if (!item) throw new Error('Quotation not found.');
    return structuredClone(item);
  }

  async loadByFormatted(formatted: string): Promise<QuotationRecord> {
    const item = this.store.documents.find(
      (d) => d.formattedDocNo.toLowerCase() === formatted.trim().toLowerCase(),
    );
    if (!item) throw new Error('Quotation not found.');
    return structuredClone(item);
  }

  async peekNextNo(prefix = 'SO'): Promise<QuotationNextNo> {
    const qtPrefix = prefix.trim().toUpperCase() || 'SO';
    const docNo = this.store.nextDocNo;
    return { qtPrefix, docNo, formattedDocNo: `${qtPrefix}-${docNo}` };
  }

  async save(input: SaveQuotationInput): Promise<SaveQuotationResult> {
    const payload = buildSavePayload(input) as Partial<QuotationRecord>;
    const qtPrefix = (payload.qtPrefix as string) || 'SO';
    let docNo = Number(payload.docNo) || 0;

    if (input.id) {
      const idx = this.store.documents.findIndex((d) => d._id === input.id);
      if (idx < 0) throw new Error('Quotation not found.');
      const existing = this.store.documents[idx];
      if (!docNo) docNo = existing.docNo;
      const updated: QuotationRecord = {
        ...existing,
        ...payload,
        _id: existing._id,
        qtPrefix,
        docNo,
        formattedDocNo: `${qtPrefix}-${docNo}`,
        lines: (payload.lines as QuotationRecord['lines']) ?? existing.lines,
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

    const created: QuotationRecord = {
      _id: `local-${crypto.randomUUID()}`,
      qtPrefix,
      docNo,
      formattedDocNo: `${qtPrefix}-${docNo}`,
      customer: input.header.customer,
      narration: input.header.narration,
      status: (payload.status as string) ?? 'open',
      quoteDate: (payload.quoteDate as string) ?? new Date().toISOString(),
      paymentTerms: input.header.paymentTerms,
      validUntil: input.header.validUntil,
      placeOfSupply: input.header.placeOfSupply,
      lines: payload.lines as QuotationRecord['lines'],
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
    if (this.store.documents.length === before) throw new Error('Quotation not found.');
    saveStore(this.store);
  }
}

export function listRowsFromRecords(records: QuotationRecord[]) {
  return records.map(recordToListRow);
}

export { recordToEditor };
