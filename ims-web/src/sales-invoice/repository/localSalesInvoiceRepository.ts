import { applyLocalListQuery } from '../../components/transaction/localListQuery';
import { DEFAULT_LIST_PAGE_SIZE } from '../../components/transaction/transactionListQuery';
import { SAMPLE_LIST_ROWS } from '../mockData';
import {
  buildSavePayload,
  createNewDocumentState,
  recordToHeader,
  recordToLines,
  recordToListRow,
} from './recordMappers';
import type {
  SalesInvoiceListQuery,
  SalesInvoiceListResult,
  SalesInvoiceListStats,
  SalesInvoiceNextNo,
  SalesInvoiceRecord,
  SalesInvoiceRepository,
  SaveSalesInvoiceInput,
  SaveSalesInvoiceResult,
} from './types';

const STORAGE_KEY = 'ims.salesInvoices.v1';

interface LocalStore {
  documents: SalesInvoiceRecord[];
  nextDocNo: number;
}

function seedDocuments(): SalesInvoiceRecord[] {
  return SAMPLE_LIST_ROWS.map((row, i) => {
    const match = row.billNo.match(/^([A-Z]+)-(\d+)$/i);
    const docPrefix = match?.[1]?.toUpperCase() ?? 'SI';
    const docNo = Number(match?.[2] ?? 1000 + i);
    return {
      _id: row.id.startsWith('local-') ? row.id : `local-${row.id}`,
      docPrefix,
      docNo,
      formattedDocNo: row.billNo,
      customer: row.customer,
      status: row.status.toLowerCase() === 'draft' ? 'draft' : 'posted',
      invoiceDate: new Date().toISOString(),
      lines: createNewDocumentState(2).lines.map((l, idx) => ({
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
  const nextDocNo = Math.max(...documents.map((d) => d.docNo), 1042) + 1;
  return { documents, nextDocNo };
}

function saveStore(store: LocalStore): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
}

function matchesStatus(record: SalesInvoiceRecord, status?: string): boolean {
  if (!status || status === 'All') return true;
  const s = (record.status ?? '').toLowerCase();
  const f = status.toLowerCase();
  if (f === 'posted') return s === 'posted' || s === 'open' || s === 'paid';
  return s === f;
}

export class LocalSalesInvoiceRepository implements SalesInvoiceRepository {
  readonly mode = 'local' as const;
  private store = loadStore();

  private persist(): void {
    saveStore(this.store);
  }

  async fetchList(query: SalesInvoiceListQuery = {}): Promise<SalesInvoiceListResult> {
    const page = query.page ?? 1;
    const limit = query.limit ?? DEFAULT_LIST_PAGE_SIZE;
    const filtered = applyLocalListQuery(this.store.documents, query, {
      getDate: (d) => d.invoiceDate ?? d.createdAt ?? '',
      getAmount: (d) => String(d.billAmount ?? d.totals?.saleAmount ?? ''),
    }).filter((d) => (query.status ? matchesStatus(d, query.status) : true));
    const total = filtered.length;
    const skip = (page - 1) * limit;
    return { items: filtered.slice(skip, skip + limit), total, page, limit };
  }

  async fetchStats(): Promise<SalesInvoiceListStats> {
    const docs = this.store.documents;
    const draft = docs.filter((d) => d.status === 'draft').length;
    const posted = docs.filter((d) => d.status === 'posted' || d.status === 'open').length;
    return { total: docs.length, draft, posted, active: draft + posted };
  }

  async loadById(id: string): Promise<SalesInvoiceRecord> {
    const item = this.store.documents.find((d) => d._id === id);
    if (!item) throw new Error('Sales invoice not found.');
    return structuredClone(item);
  }

  async loadByFormatted(formatted: string): Promise<SalesInvoiceRecord> {
    const item = this.store.documents.find(
      (d) => d.formattedDocNo.toLowerCase() === formatted.trim().toLowerCase(),
    );
    if (!item) throw new Error('Sales invoice not found.');
    return structuredClone(item);
  }

  async peekNextNo(prefix = 'SI'): Promise<SalesInvoiceNextNo> {
    const docPrefix = prefix.trim().toUpperCase() || 'SI';
    const docNo = this.store.nextDocNo;
    return {
      docPrefix,
      docNo,
      formattedDocNo: `${docPrefix}-${docNo}`,
    };
  }

  async save(input: SaveSalesInvoiceInput): Promise<SaveSalesInvoiceResult> {
    const payload = buildSavePayload(input) as Partial<SalesInvoiceRecord>;
    const docPrefix = (payload.docPrefix as string) || 'SI';
    let docNo = Number(payload.docNo) || 0;

    if (input.id) {
      const idx = this.store.documents.findIndex((d) => d._id === input.id);
      if (idx < 0) throw new Error('Sales invoice not found.');
      const existing = this.store.documents[idx];
      if (!docNo) docNo = existing.docNo;
      const updated: SalesInvoiceRecord = {
        ...existing,
        ...payload,
        _id: existing._id,
        docPrefix,
        docNo,
        formattedDocNo: `${docPrefix}-${docNo}`,
        lines: (payload.lines as SalesInvoiceRecord['lines']) ?? existing.lines,
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
    const created: SalesInvoiceRecord = {
      _id,
      docPrefix,
      docNo,
      formattedDocNo: `${docPrefix}-${docNo}`,
      customer: input.header.customer,
      narration: input.header.narration,
      status: (payload.status as string) ?? 'open',
      invoiceDate: (payload.invoiceDate as string) ?? new Date().toISOString(),
      dueDate: payload.dueDate as string | undefined,
      dcReference: input.header.dcReference,
      gstin: input.header.customerGstin,
      placeOfSupply: input.header.placeOfSupply,
      ewayBillNo: input.header.ewayBillNo,
      ewayBillDate: payload.ewayBillDate as string | undefined,
      vehicleNo: input.header.vehicleNo,
      transporter: input.header.transporter,
      transporterId: input.header.transporterId,
      distanceKm: (payload.distanceKm as number) ?? 0,
      paymentType: payload.paymentType as string,
      paymentMode: payload.paymentMode as string,
      billAmount: payload.billAmount as number,
      paidAmount: payload.paidAmount as number,
      balanceDue: payload.balanceDue as number,
      lines: payload.lines as SalesInvoiceRecord['lines'],
      totals: payload.totals as SalesInvoiceRecord['totals'],
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
    if (this.store.documents.length === before) throw new Error('Sales invoice not found.');
    this.persist();
  }
}

/** Map loaded record into editor state. */
export function recordToEditor(record: SalesInvoiceRecord) {
  return {
    documentId: record._id,
    header: recordToHeader(record),
    lines: recordToLines(record),
  };
}

export function listRowsFromRecords(records: SalesInvoiceRecord[]) {
  return records.map(recordToListRow);
}
