import { filterSavableLines } from '../../components/transaction/transactionLineUtils';
import { computeTotals, formatDisplay } from '../../sales-invoice/calculations';
import { createDefaultHeader, createSampleGrnLines } from '../mockData';
import { grnTaxHeader } from '../taxContext';
import type { GrnHeader, GrnLineItem, GrnListRow } from '../types';
import { recordDocumentId } from '../../repository/recordDocumentId';
import type { GrnApiLine, GrnRecord, SaveGrnInput } from './types';

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

export function apiLineToUi(line: GrnApiLine, index: number): GrnLineItem {
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
    poPrefix: line.poPrefix,
    poDocNo: line.poDocNo ?? undefined,
    poFormattedDocNo: line.poFormattedDocNo,
    poLineSr: line.poLineSr ?? undefined,
    poOrderedQty: num(line.poOrderedQty),
    poPendingQty: num(line.poPendingQty),
  };
}

export function uiLineToApi(line: GrnLineItem): GrnApiLine {
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
    poPrefix: line.poPrefix,
    poDocNo: line.poDocNo,
    poFormattedDocNo: line.poFormattedDocNo,
    poLineSr: line.poLineSr,
    poOrderedQty: line.poOrderedQty != null ? String(line.poOrderedQty) : undefined,
    poPendingQty: line.poPendingQty != null ? String(line.poPendingQty) : undefined,
  };
}

export function recordToHeader(record: GrnRecord): GrnHeader {
  const grnDate = record.grnDate
    ? new Date(record.grnDate).toISOString().slice(0, 10)
    : new Date().toISOString().slice(0, 10);
  return {
    entryDocPrefix: record.docPrefix || 'GRN',
    billNo: String(record.docNo ?? ''),
    supplier: record.supplier || '',
    grnDate,
    poReference: record.poReference ?? '',
    warehouse: record.warehouse ?? '',
    vehicleNo: record.vehicleNo ?? '',
    transporter: record.transporter ?? '',
    buyer: record.buyer ?? '',
    companyGstin: '24AABCU9603R1ZM',
    supplierGstin: record.billingAddress?.startsWith('GSTIN:')
      ? record.billingAddress.replace('GSTIN:', '').trim()
      : '',
    placeOfSupply: record.placeOfSupply ?? record.shipToAddress ?? '24-Gujarat',
    narration: record.narration ?? '',
  };
}

export function recordToLines(record: GrnRecord): GrnLineItem[] {
  const raw = record.lines ?? [];
  if (raw.length === 0) return createSampleGrnLines(1);
  return raw.map((l, i) => apiLineToUi(l, i));
}

export function recordToListRow(record: GrnRecord): GrnListRow {
  const header = recordToHeader(record);
  const amount =
    record.orderAmount != null
      ? formatDisplay(record.orderAmount)
      : formatDisplay(computeTotals(recordToLines(record), grnTaxHeader(header)).invoiceTotal);
  const status = (record.status ?? 'open').charAt(0).toUpperCase() + (record.status ?? 'open').slice(1);
  return {
    id: recordDocumentId(record),
    billNo: record.formattedDocNo || `${record.docPrefix}-${record.docNo}`,
    date: formatListDate(record.grnDate ?? record.createdAt),
    supplier: record.supplier,
    poReference: record.poReference ?? '',
    amount,
    status,
  };
}

export function buildSavePayload(input: SaveGrnInput): Record<string, unknown> {
  const { header, lines } = input;
  const savableLines = filterSavableLines(lines);
  const totals = computeTotals(savableLines, grnTaxHeader(header));
  const docNo = parseInt(header.billNo, 10) || 0;
  const docPrefix = (header.entryDocPrefix || 'GRN').trim().toUpperCase();
  return {
    docPrefix,
    docNo: docNo || undefined,
    supplier: header.supplier,
    buyer: header.buyer,
    narration: header.narration,
    grnDate: toIsoDate(header.grnDate),
    warehouse: header.warehouse,
    vehicleNo: header.vehicleNo,
    transporter: header.transporter,
    poReference: header.poReference,
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
  return { header: createDefaultHeader(), lines: createSampleGrnLines(lineCount) };
}

export function serializeDocumentBaseline(header: GrnHeader, lines: GrnLineItem[]): string {
  return JSON.stringify({ header, lines });
}

export function recordToEditor(record: GrnRecord) {
  return {
    documentId: record._id,
    header: recordToHeader(record),
    lines: recordToLines(record),
  };
}
