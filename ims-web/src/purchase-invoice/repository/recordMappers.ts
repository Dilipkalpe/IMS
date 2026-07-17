import { filterSavableLines, formatTransactionListStatus } from '../../components/transaction/transactionLineUtils';
import { computeTotals, formatDisplay, isInterStateSupply } from '../../sales-invoice/calculations';
import {
  displayPaymentType,
  resolveSaveStatus,
  toApiPaymentMode,
  toApiPaymentType,
  uiPaymentMode,
} from '../../sales-invoice/invoicePayment';
import { createDefaultHeader, createSampleLines } from '../mockData';
import { purchaseTaxHeader } from '../taxContext';
import type { PurchaseInvoiceHeader, PurchaseInvoiceLineItem, PurchaseInvoiceListRow } from '../types';
import { recordDocumentId } from '../../repository/recordDocumentId';
import type {
  PurchaseInvoiceApiLine,
  PurchaseInvoiceRecord,
  SavePurchaseInvoiceInput,
} from './types';

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

export function apiLineToUi(line: PurchaseInvoiceApiLine, index: number): PurchaseInvoiceLineItem {
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

export function uiLineToApi(line: PurchaseInvoiceLineItem, interState = false): PurchaseInvoiceApiLine {
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
    taxType: interState ? 'IGST' : 'GST',
  };
}

export function recordToHeader(record: PurchaseInvoiceRecord): PurchaseInvoiceHeader {
  const invoiceDate = record.invoiceDate
    ? new Date(record.invoiceDate).toISOString().slice(0, 10)
    : new Date().toISOString().slice(0, 10);
  const dueDate = record.dueDate
    ? new Date(record.dueDate).toISOString().slice(0, 10)
    : invoiceDate;
  return {
    entryDocPrefix: record.docPrefix || 'PI',
    billNo: String(record.docNo ?? ''),
    supplier: record.supplier || '',
    invoiceDate,
    grnReference: record.grnReference ?? '',
    dueDate,
    companyGstin: '24AABCU9603R1ZM',
    supplierGstin: record.gstin ?? '',
    placeOfSupply: record.placeOfSupply ?? '24-Gujarat',
    paymentType: displayPaymentType(record.paymentType),
    paymentMode: uiPaymentMode(displayPaymentType(record.paymentType), record.paymentMode),
    paidAmount: record.paidAmount ?? 0,
    narration: record.narration ?? '',
  };
}

export function recordToLines(record: PurchaseInvoiceRecord): PurchaseInvoiceLineItem[] {
  const raw = record.lines ?? [];
  if (raw.length === 0) return createSampleLines(1);
  return raw.map((l, i) => apiLineToUi(l, i));
}

export function recordToListRow(record: PurchaseInvoiceRecord): PurchaseInvoiceListRow {
  const amount =
    record.billAmount != null
      ? formatDisplay(record.billAmount)
      : formatDisplay(computeTotals(recordToLines(record), purchaseTaxHeader(recordToHeader(record))).invoiceTotal);
  return {
    id: recordDocumentId(record),
    billNo: record.formattedDocNo || `${record.docPrefix}-${record.docNo}`,
    date: formatListDate(record.invoiceDate ?? record.createdAt),
    supplier: record.supplier,
    amount,
    status: formatTransactionListStatus(record.status),
  };
}

export function buildSavePayload(input: SavePurchaseInvoiceInput): Record<string, unknown> {
  const { header, lines } = input;
  const savableLines = filterSavableLines(lines);
  const taxHeader = purchaseTaxHeader(header);
  const interState = isInterStateSupply(taxHeader);
  const totals = computeTotals(savableLines, taxHeader, {
    paymentType: header.paymentType,
    paidAmount: header.paidAmount,
  });
  const docNo = parseInt(header.billNo, 10) || 0;
  const docPrefix = (header.entryDocPrefix || 'PI').trim().toUpperCase();
  return {
    docPrefix,
    docNo: docNo || undefined,
    supplier: header.supplier,
    narration: header.narration,
    invoiceDate: toIsoDate(header.invoiceDate),
    dueDate: toIsoDate(header.dueDate),
    grnReference: header.grnReference,
    gstin: header.supplierGstin,
    placeOfSupply: header.placeOfSupply,
    paymentType: toApiPaymentType(header.paymentType),
    paymentMode: toApiPaymentMode(header.paymentMode, header.paymentType),
    status: resolveSaveStatus(header.paymentType, totals.invoiceTotal, totals.balanceDue),
    billAmount: totals.invoiceTotal,
    paidAmount: totals.paidAmount,
    balanceDue: totals.balanceDue,
    lines: savableLines.map((line) => uiLineToApi(line, interState)),
    totals: {
      net: String(totals.invoiceTotal),
      saleAmount: String(totals.invoiceTotal),
      discount: String(totals.totalDiscount),
    },
  };
}

export function createNewDocumentState(lineCount = 8): {
  header: PurchaseInvoiceHeader;
  lines: PurchaseInvoiceLineItem[];
} {
  return {
    header: createDefaultHeader(),
    lines: createSampleLines(lineCount),
  };
}

export function serializeDocumentBaseline(header: PurchaseInvoiceHeader, lines: PurchaseInvoiceLineItem[]): string {
  return JSON.stringify({ header, lines });
}

export function recordToEditor(record: PurchaseInvoiceRecord) {
  return {
    documentId: record._id,
    header: recordToHeader(record),
    lines: recordToLines(record),
    paymentLinks: record.paymentLinks ?? [],
  };
}
