import { filterSavableLines } from '../../components/transaction/transactionLineUtils';
import { computeTotals, formatDisplay } from '../../sales-invoice/calculations';
import { createDefaultHeader, createSampleLines } from '../mockData';
import { purchaseOrderTaxHeader } from '../taxContext';
import type { PurchaseOrderHeader, PurchaseOrderLineItem, PurchaseOrderListRow } from '../types';
import { recordDocumentId } from '../../repository/recordDocumentId';
import type { PurchaseOrderApiLine, PurchaseOrderRecord, SavePurchaseOrderInput } from './types';

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

export function apiLineToUi(line: PurchaseOrderApiLine, index: number): PurchaseOrderLineItem {
  const sr = line.sr ?? index + 1;
  const taxPct = num(line.taxPercent);
  return {
    id: `line-${sr}-${index}`,
    sr,
    productRetailCode: line.productRetailCode ?? '',
    itemDescription: line.itemDescription ?? '',
    qty: num(line.qty),
    rate: num(line.rate),
    salesRate: num(line.salesRate) || num(line.rate),
    discPercent: num(line.discPercent),
    cgstPercent: taxPct / 2,
    sgstPercent: taxPct / 2,
    igstPercent: 0,
  };
}

export function uiLineToApi(line: PurchaseOrderLineItem): PurchaseOrderApiLine {
  const taxPercent = (line.cgstPercent || 0) + (line.sgstPercent || 0) + (line.igstPercent || 0);
  return {
    sr: line.sr,
    productRetailCode: line.productRetailCode,
    itemDescription: line.itemDescription,
    qty: String(line.qty),
    rate: String(line.rate),
    salesRate: String(line.salesRate),
    discPercent: String(line.discPercent),
    taxPercent: String(taxPercent),
  };
}

export function recordToHeader(record: PurchaseOrderRecord): PurchaseOrderHeader {
  const orderDate = record.poDate
    ? new Date(record.poDate).toISOString().slice(0, 10)
    : new Date().toISOString().slice(0, 10);
  return {
    entryDocPrefix: record.docPrefix || 'PO',
    billNo: String(record.docNo ?? ''),
    supplier: record.supplier || '',
    orderDate,
    paymentTerms: record.paymentTerms ?? '',
    dueDate: orderDate,
    companyGstin: '24AABCU9603R1ZM',
    supplierGstin: record.billingAddress?.startsWith('GSTIN:')
      ? record.billingAddress.replace('GSTIN:', '').trim()
      : '',
    placeOfSupply: record.placeOfSupply ?? record.shipToAddress ?? '24-Gujarat',
    deliveryPriority: record.deliveryPriority ?? 'Normal',
    narration: record.narration ?? '',
  };
}

export function recordToLines(record: PurchaseOrderRecord): PurchaseOrderLineItem[] {
  const raw = record.lines ?? [];
  if (raw.length === 0) return createSampleLines(1);
  return raw.map((l, i) => apiLineToUi(l, i));
}

export function recordToListRow(record: PurchaseOrderRecord): PurchaseOrderListRow {
  const header = recordToHeader(record);
  const amount =
    record.orderAmount != null
      ? formatDisplay(record.orderAmount)
      : formatDisplay(computeTotals(recordToLines(record), purchaseOrderTaxHeader(header)).invoiceTotal);
  const status = (record.status ?? 'open').charAt(0).toUpperCase() + (record.status ?? 'open').slice(1);
  return {
    id: recordDocumentId(record),
    billNo: record.formattedDocNo || `${record.docPrefix}-${record.docNo}`,
    date: formatListDate(record.poDate ?? record.createdAt),
    supplier: record.supplier,
    amount,
    status,
  };
}

export function buildSavePayload(input: SavePurchaseOrderInput): Record<string, unknown> {
  const { header, lines } = input;
  const savableLines = filterSavableLines(lines);
  const totals = computeTotals(savableLines, purchaseOrderTaxHeader(header));
  const docNo = parseInt(header.billNo, 10) || 0;
  const docPrefix = (header.entryDocPrefix || 'PO').trim().toUpperCase();
  return {
    docPrefix,
    docNo: docNo || undefined,
    supplier: header.supplier,
    narration: header.narration,
    poDate: toIsoDate(header.orderDate),
    paymentTerms: header.paymentTerms,
    deliveryPriority: header.deliveryPriority,
    billingAddress: header.supplierGstin ? `GSTIN:${header.supplierGstin}` : '',
    shipToAddress: header.placeOfSupply,
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

export function serializeDocumentBaseline(header: PurchaseOrderHeader, lines: PurchaseOrderLineItem[]): string {
  return JSON.stringify({ header, lines });
}

export function recordToEditor(record: PurchaseOrderRecord) {
  return {
    documentId: record._id,
    header: recordToHeader(record),
    lines: recordToLines(record),
  };
}
