import type { SalesReturnUiSnapshot } from '../../document/mappers/salesReturnPrintMapper';
import { filterSavableLines } from '../../components/transaction/transactionLineUtils';
import { computeTotals, formatDisplay, taxContextFromHeader } from '../../sales-invoice/calculations';
import { createDefaultHeader, createSampleLines } from '../mockData';
import type { SalesReturnHeader, SalesReturnLineItem, SalesReturnListRow } from '../types';
import { recordDocumentId } from '../../repository/recordDocumentId';
import type { SalesReturnApiLine, SalesReturnRecord, SaveSalesReturnInput } from './types';

function num(v: string | number | undefined): number {
  if (typeof v === 'number') return v;
  const n = parseFloat(String(v ?? '0'));
  return Number.isFinite(n) ? n : 0;
}

function formatListDate(iso?: string): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const yyyy = d.getFullYear();
  return `${dd}-${mm}-${yyyy}`;
}

function toIsoDate(ui: string): string | undefined {
  if (!ui?.trim()) return undefined;
  const d = new Date(ui);
  return Number.isNaN(d.getTime()) ? undefined : d.toISOString();
}

export function apiLineToUi(line: SalesReturnApiLine, index: number): SalesReturnLineItem {
  const sr = line.sr ?? index + 1;
  const taxPct = num(line.taxPercent);
  return {
    id: `line-${sr}-${index}`,
    sr,
    productRetailCode: line.productRetailCode ?? '',
    itemDescription: line.itemDescription ?? '',
    qty: num(line.qty),
    rate: num(line.rate),
    salesRate: num(line.rate),
    discPercent: num(line.discPercent),
    cgstPercent: taxPct / 2,
    sgstPercent: taxPct / 2,
    igstPercent: 0,
  };
}

export function uiLineToApi(line: SalesReturnLineItem): SalesReturnApiLine {
  const taxPercent = (line.cgstPercent || 0) + (line.sgstPercent || 0) + (line.igstPercent || 0);
  return {
    sr: line.sr,
    productRetailCode: line.productRetailCode,
    itemDescription: line.itemDescription,
    qty: String(line.qty),
    rate: String(line.rate),
    discPercent: String(line.discPercent),
    taxPercent: String(taxPercent),
  };
}

export function recordToHeader(record: SalesReturnRecord): SalesReturnHeader {
  const returnDate = record.returnDate
    ? new Date(record.returnDate).toISOString().slice(0, 10)
    : new Date().toISOString().slice(0, 10);
  return {
    entryDocPrefix: record.docPrefix || 'SR',
    billNo: String(record.docNo ?? ''),
    customer: record.customer || '',
    returnDate,
    invoiceReference: record.invoiceReference ?? '',
    returnReason: record.returnReason ?? '',
    returnWarehouse: record.returnWarehouse ?? '',
    sellerGstin: '24AABCU9603R1ZM',
    customerGstin: record.billingAddress?.startsWith('GSTIN:')
      ? record.billingAddress.replace('GSTIN:', '').trim()
      : '',
    placeOfSupply: record.placeOfSupply ?? record.shippingAddress ?? '24-Gujarat',
    qcRemark: record.qcRemark ?? 'Normal',
    narration: record.narration ?? '',
  };
}

export function recordToLines(record: SalesReturnRecord): SalesReturnLineItem[] {
  const raw = record.lines ?? [];
  if (raw.length === 0) return createSampleLines(1);
  return raw.map((l, i) => apiLineToUi(l, i));
}

export function recordToListRow(record: SalesReturnRecord): SalesReturnListRow {
  const header = recordToHeader(record);
  const amount =
    record.orderAmount != null
      ? formatDisplay(record.orderAmount)
      : formatDisplay(computeTotals(recordToLines(record), taxContextFromHeader(header)).invoiceTotal);
  const status = (record.status ?? 'open').charAt(0).toUpperCase() + (record.status ?? 'open').slice(1);
  return {
    id: recordDocumentId(record),
    billNo: record.formattedDocNo || `${record.docPrefix}-${record.docNo}`,
    date: formatListDate(record.returnDate ?? record.createdAt),
    customer: record.customer,
    amount,
    status,
  };
}

export function buildSavePayload(input: SaveSalesReturnInput): Record<string, unknown> {
  const { header, lines } = input;
  const savableLines = filterSavableLines(lines);
  const taxHeader = taxContextFromHeader({
    placeOfSupply: header.placeOfSupply,
    sellerGstin: header.sellerGstin,
    customerGstin: header.customerGstin,
  });
  const totals = computeTotals(savableLines, taxHeader);
  const docNo = parseInt(header.billNo, 10) || 0;
  const docPrefix = (header.entryDocPrefix || 'SR').trim().toUpperCase();
  return {
    docPrefix,
    docNo: docNo || undefined,
    customer: header.customer,
    narration: header.narration,
    returnDate: toIsoDate(header.returnDate),
    invoiceReference: header.invoiceReference,
    returnReason: header.returnReason,
    returnWarehouse: header.returnWarehouse,
    qcRemark: header.qcRemark,
    billingAddress: header.customerGstin ? `GSTIN:${header.customerGstin}` : '',
    shippingAddress: header.placeOfSupply,
    placeOfSupply: header.placeOfSupply,
    status: input.status ?? 'open',
    lines: savableLines.map(uiLineToApi),
    totals: {
      net: String(totals.invoiceTotal),
      orderAmount: String(totals.invoiceTotal),
      saleAmount: String(totals.invoiceTotal),
      discount: String(totals.totalDiscount),
    },
    orderAmount: totals.invoiceTotal,
  };
}

export function createNewDocumentState(lineCount = 8) {
  return { header: createDefaultHeader(), lines: createSampleLines(lineCount) };
}

export function serializeDocumentBaseline(header: SalesReturnHeader, lines: SalesReturnLineItem[]): string {
  return JSON.stringify({ header, lines });
}

export function recordToEditor(record: SalesReturnRecord) {
  return {
    documentId: record._id,
    header: recordToHeader(record),
    lines: recordToLines(record),
  };
}

export function recordToUiSnapshot(record: SalesReturnRecord): SalesReturnUiSnapshot {
  const header = recordToHeader(record);
  const lines = recordToLines(record);
  const totals = computeTotals(lines, taxContextFromHeader(header));
  return {
    documentId: record._id,
    header,
    lines,
    totals,
  };
}
