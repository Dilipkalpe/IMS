import {
  buildDcReferenceTextFromSiLines,
  collectDcReferencesFromSiLines,
  formatNumberedDocReferenceText,
  lineHasDeliveryChallanSource,
} from '../../components/transaction/documentLineReferences';
import type { SalesInvoiceUiSnapshot } from '../../document/mappers/salesInvoicePrintMapper';
import { filterSavableLines, formatTransactionListStatus } from '../../components/transaction/transactionLineUtils';
import { computeTotals, formatDisplay, isInterStateSupply, taxContextFromHeader } from '../calculations';
import {
  displayPaymentType,
  resolveSaveStatus,
  toApiPaymentMode,
  toApiPaymentType,
  uiPaymentMode,
} from '../invoicePayment';
import { createDefaultHeader, createSampleLines } from '../mockData';
import type { SalesInvoiceHeader, SalesInvoiceLineItem, SalesInvoiceListRow } from '../types';
import { recordDocumentId } from '../../repository/recordDocumentId';
import type { SalesInvoiceApiLine, SalesInvoiceRecord, SaveSalesInvoiceInput } from './types';

function num(v: string | number | undefined): number {
  if (typeof v === 'number') return v;
  const n = parseFloat(String(v ?? '0'));
  return Number.isFinite(n) ? n : 0;
}

function str(v: string | number | undefined): string {
  return String(v ?? '');
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

export function apiLineToUi(line: SalesInvoiceApiLine, index: number): SalesInvoiceLineItem {
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
    dcPrefix: line.dcPrefix,
    dcDocNo: line.dcDocNo ?? undefined,
    dcFormattedDocNo: line.dcFormattedDocNo,
    dcLineSr: line.dcLineSr ?? undefined,
    dcDeliveredQty: num(line.dcDeliveredQty),
    dcPendingQty: num(line.dcPendingQty),
  };
}

export function uiLineToApi(line: SalesInvoiceLineItem, interState = false): SalesInvoiceApiLine {
  const taxPercent = (line.cgstPercent || 0) + (line.sgstPercent || 0) + (line.igstPercent || 0);
  const base: SalesInvoiceApiLine = {
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

  if (!lineHasDeliveryChallanSource(line)) {
    return base;
  }

  const dcPrefix = (line.dcPrefix || 'DC').trim().toUpperCase();
  return {
    ...base,
    dcPrefix,
    dcDocNo: line.dcDocNo,
    dcFormattedDocNo: line.dcFormattedDocNo ?? `${dcPrefix}-${line.dcDocNo}`,
    dcLineSr: line.dcLineSr,
    dcDeliveredQty: line.dcDeliveredQty != null ? String(line.dcDeliveredQty) : undefined,
    dcPendingQty: line.dcPendingQty != null ? String(line.dcPendingQty) : undefined,
  };
}

export function recordToHeader(record: SalesInvoiceRecord): SalesInvoiceHeader {
  const invoiceDate = record.invoiceDate
    ? new Date(record.invoiceDate).toISOString().slice(0, 10)
    : new Date().toISOString().slice(0, 10);
  const dueDate = record.dueDate
    ? new Date(record.dueDate).toISOString().slice(0, 10)
    : invoiceDate;
  return {
    entryDocPrefix: record.docPrefix || 'SI',
    billNo: String(record.docNo ?? ''),
    customer: record.customer || '',
    invoiceDate,
    dcReference:
      record.dcReference?.trim() ||
      (record.dcReferences?.length ? formatNumberedDocReferenceText(record.dcReferences) : '') ||
      buildDcReferenceTextFromSiLines(record.lines ?? []),
    dueDate,
    sellerGstin: '24AABCU9603R1ZM',
    customerGstin: record.gstin ?? '',
    placeOfSupply: record.placeOfSupply ?? '24-Gujarat',
    paymentType: displayPaymentType(record.paymentType),
    paymentMode: uiPaymentMode(displayPaymentType(record.paymentType), record.paymentMode),
    paidAmount: record.paidAmount ?? 0,
    narration: record.narration ?? '',
    ewayBillNo: record.ewayBillNo ?? '',
    ewayBillDate: record.ewayBillDate
      ? new Date(record.ewayBillDate).toISOString().slice(0, 10)
      : '',
    vehicleNo: record.vehicleNo ?? '',
    transporter: record.transporter ?? '',
    transporterId: record.transporterId ?? '',
    distanceKm:
      record.distanceKm != null && Number(record.distanceKm) > 0
        ? String(record.distanceKm)
        : '',
  };
}

export function recordToLines(record: SalesInvoiceRecord): SalesInvoiceLineItem[] {
  const raw = record.lines ?? [];
  if (raw.length === 0) return createSampleLines(1);
  return raw.map((l, i) => apiLineToUi(l, i));
}

export function recordToListRow(record: SalesInvoiceRecord): SalesInvoiceListRow {
  const amount =
    record.billAmount != null
      ? formatDisplay(record.billAmount)
      : formatDisplay(computeTotals(recordToLines(record)).invoiceTotal);
  return {
    id: recordDocumentId(record),
    billNo: record.formattedDocNo || `${record.docPrefix}-${record.docNo}`,
    date: formatListDate(record.invoiceDate ?? record.createdAt),
    customer: record.customer,
    amount,
    status: formatTransactionListStatus(record.status),
  };
}

export function buildSavePayload(input: SaveSalesInvoiceInput): Record<string, unknown> {
  const { header, lines } = input;
  const savableLines = filterSavableLines(lines);
  const taxHeader = taxContextFromHeader(header);
  const interState = isInterStateSupply(taxHeader);
  const totals = computeTotals(savableLines, taxHeader, {
    paymentType: header.paymentType,
    paidAmount: header.paidAmount,
  });
  const docNo = parseInt(header.billNo, 10) || 0;
  const docPrefix = (header.entryDocPrefix || 'SI').trim().toUpperCase();
  const apiLines = savableLines.map((line) => uiLineToApi(line, interState));
  const dcReferences = collectDcReferencesFromSiLines(savableLines);
  const dcReference = buildDcReferenceTextFromSiLines(savableLines) || header.dcReference?.trim() || '';
  return {
    docPrefix,
    docNo: docNo || undefined,
    customer: header.customer,
    narration: header.narration,
    invoiceDate: toIsoDate(header.invoiceDate),
    dueDate: toIsoDate(header.dueDate),
    dcReference,
    dcReferences,
    gstin: header.customerGstin,
    placeOfSupply: header.placeOfSupply,
    ewayBillNo: header.ewayBillNo?.trim() || '',
    ewayBillDate: toIsoDate(header.ewayBillDate),
    vehicleNo: header.vehicleNo?.trim() || '',
    transporter: header.transporter?.trim() || '',
    transporterId: header.transporterId?.trim() || '',
    distanceKm: (() => {
      const n = parseFloat(String(header.distanceKm ?? '').trim());
      return Number.isFinite(n) && n > 0 ? n : 0;
    })(),
    paymentType: toApiPaymentType(header.paymentType),
    paymentMode: toApiPaymentMode(header.paymentMode, header.paymentType),
    status: resolveSaveStatus(header.paymentType, totals.invoiceTotal, totals.balanceDue),
    billAmount: totals.invoiceTotal,
    paidAmount: totals.paidAmount,
    balanceDue: totals.balanceDue,
    lines: apiLines,
    totals: {
      net: String(totals.invoiceTotal),
      saleAmount: String(totals.invoiceTotal),
      discount: String(totals.totalDiscount),
    },
  };
}

export function createNewDocumentState(lineCount = 8): {
  header: SalesInvoiceHeader;
  lines: SalesInvoiceLineItem[];
} {
  return {
    header: createDefaultHeader(),
    lines: createSampleLines(lineCount),
  };
}

export function serializeDocumentBaseline(header: SalesInvoiceHeader, lines: SalesInvoiceLineItem[]): string {
  return JSON.stringify({ header, lines });
}

export function recordToEditor(record: SalesInvoiceRecord) {
  return {
    documentId: record._id,
    header: recordToHeader(record),
    lines: recordToLines(record),
    paymentLinks: record.paymentLinks ?? [],
  };
}

export function recordToUiSnapshot(record: SalesInvoiceRecord): SalesInvoiceUiSnapshot {
  const header = recordToHeader(record);
  const lines = recordToLines(record);
  const totals = computeTotals(lines, taxContextFromHeader(header), {
    paymentType: header.paymentType,
    paidAmount: header.paidAmount,
  });
  return {
    documentId: record._id,
    header,
    lines,
    totals,
  };
}
