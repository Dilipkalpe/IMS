import {
  buildSoReferenceTextFromDcLines,
  collectSoReferencesFromDcLines,
  lineHasSalesOrderSource,
} from '../../components/transaction/documentLineReferences';
import type { DeliveryChallanUiSnapshot } from '../../document/mappers/deliveryChallanPrintMapper';
import { filterSavableLines } from '../../components/transaction/transactionLineUtils';
import { computeTotals, formatDisplay } from '../../sales-invoice/calculations';
import { createDefaultHeader, createSampleDeliveryChallanLines } from '../mockData';
import { dcTaxHeader } from '../taxContext';
import type { DeliveryChallanHeader, DeliveryChallanLineItem, DeliveryChallanListRow } from '../types';
import { recordDocumentId } from '../../repository/recordDocumentId';
import type { DeliveryChallanApiLine, DeliveryChallanRecord, SaveDeliveryChallanInput } from './types';

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

export function apiLineToUi(line: DeliveryChallanApiLine, index: number): DeliveryChallanLineItem {
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
    soPrefix: line.soPrefix,
    soDocNo: line.soDocNo ?? undefined,
    soFormattedDocNo: line.soFormattedDocNo,
    soLineSr: line.soLineSr ?? undefined,
    soOrderedQty: num(line.soOrderedQty),
    soPendingQty: num(line.soPendingQty),
  };
}

export function uiLineToApi(line: DeliveryChallanLineItem): DeliveryChallanApiLine {
  const taxPercent = (line.cgstPercent || 0) + (line.sgstPercent || 0) + (line.igstPercent || 0);
  const base: DeliveryChallanApiLine = {
    sr: line.sr,
    productRetailCode: line.productRetailCode,
    itemDescription: line.itemDescription,
    qty: String(line.qty),
    rate: String(line.rate),
    salesRate: String(line.salesRate),
    discPercent: String(line.discPercent),
    taxPercent: String(taxPercent),
  };

  if (!lineHasSalesOrderSource(line)) {
    return base;
  }

  const soPrefix = (line.soPrefix || 'SO').trim().toUpperCase();
  return {
    ...base,
    soPrefix,
    soDocNo: line.soDocNo,
    soFormattedDocNo: line.soFormattedDocNo ?? `${soPrefix}-${line.soDocNo}`,
    soLineSr: line.soLineSr,
    soOrderedQty: line.soOrderedQty != null ? String(line.soOrderedQty) : undefined,
    soPendingQty: line.soPendingQty != null ? String(line.soPendingQty) : undefined,
  };
}

export function recordToHeader(record: DeliveryChallanRecord): DeliveryChallanHeader {
  const dcDate = record.dcDate
    ? new Date(record.dcDate).toISOString().slice(0, 10)
    : new Date().toISOString().slice(0, 10);
  return {
    entryDocPrefix: record.docPrefix || 'DC',
    billNo: String(record.docNo ?? ''),
    customer: record.customer || '',
    dcDate,
    soReference:
      record.soReference?.trim() ||
      buildSoReferenceTextFromDcLines(record.soReferences ?? []) ||
      buildSoReferenceTextFromDcLines(record.lines ?? []),
    warehouse: record.warehouse ?? '',
    vehicleNo: record.vehicleNo ?? '',
    transporter: record.transporter ?? '',
    salesMan: record.salesMan ?? '',
    sellerGstin: '24AABCU9603R1ZM',
    customerGstin: record.billingAddress?.startsWith('GSTIN:')
      ? record.billingAddress.replace('GSTIN:', '').trim()
      : '',
    placeOfSupply: record.placeOfSupply ?? record.shipToAddress ?? '24-Gujarat',
    narration: record.narration ?? '',
  };
}

export function recordToLines(record: DeliveryChallanRecord): DeliveryChallanLineItem[] {
  const raw = record.lines ?? [];
  if (raw.length === 0) return createSampleDeliveryChallanLines(1);
  return raw.map((l, i) => apiLineToUi(l, i));
}

export function recordToListRow(record: DeliveryChallanRecord): DeliveryChallanListRow {
  const header = recordToHeader(record);
  const amount =
    record.orderAmount != null
      ? formatDisplay(record.orderAmount)
      : formatDisplay(computeTotals(recordToLines(record), dcTaxHeader(header)).invoiceTotal);
  const status = (record.status ?? 'open').charAt(0).toUpperCase() + (record.status ?? 'open').slice(1);
  return {
    id: recordDocumentId(record),
    billNo: record.formattedDocNo || `${record.docPrefix}-${record.docNo}`,
    date: formatListDate(record.dcDate ?? record.createdAt),
    customer: record.customer,
    soReference: record.soReference ?? '',
    amount,
    status,
  };
}

export function buildSavePayload(input: SaveDeliveryChallanInput): Record<string, unknown> {
  const { header, lines } = input;
  const savableLines = filterSavableLines(lines);
  const totals = computeTotals(savableLines, dcTaxHeader(header));
  const docNo = parseInt(header.billNo, 10) || 0;
  const docPrefix = (header.entryDocPrefix || 'DC').trim().toUpperCase();
  const apiLines = savableLines.map(uiLineToApi);
  const soReferences = collectSoReferencesFromDcLines(savableLines);
  const soReference = buildSoReferenceTextFromDcLines(savableLines) || header.soReference?.trim() || '';
  return {
    docPrefix,
    docNo: docNo || undefined,
    customer: header.customer,
    salesMan: header.salesMan,
    narration: header.narration,
    dcDate: toIsoDate(header.dcDate),
    warehouse: header.warehouse,
    vehicleNo: header.vehicleNo,
    transporter: header.transporter,
    soReference,
    soReferences,
    billingAddress: header.customerGstin ? `GSTIN:${header.customerGstin}` : '',
    shipToAddress: header.placeOfSupply,
    placeOfSupply: header.placeOfSupply,
    status: input.status ?? 'open',
    lines: apiLines,
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
  return { header: createDefaultHeader(), lines: createSampleDeliveryChallanLines(lineCount) };
}

export function serializeDocumentBaseline(header: DeliveryChallanHeader, lines: DeliveryChallanLineItem[]): string {
  return JSON.stringify({ header, lines });
}

export function recordToEditor(record: DeliveryChallanRecord) {
  return {
    documentId: record._id,
    header: recordToHeader(record),
    lines: recordToLines(record),
  };
}

export function recordToUiSnapshot(record: DeliveryChallanRecord): DeliveryChallanUiSnapshot {
  const header = recordToHeader(record);
  const lines = recordToLines(record);
  const totals = computeTotals(lines, dcTaxHeader(header));
  return {
    documentId: record._id,
    header,
    lines,
    totals,
  };
}
