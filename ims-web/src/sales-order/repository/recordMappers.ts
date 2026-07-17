import { getAuthSession } from '../../api/auth';
import type { SalesOrderListSummary } from '../../api/salesOrders';
import type { SalesOrderUiSnapshot } from '../../document/mappers/salesOrderPrintMapper';
import {
  computeTotals,
  formatDisplay,
  isInterStateSupply,
  taxContextFromHeader,
} from '../../sales-invoice/calculations';
import { createDefaultHeader, createEmptyLines } from '../mockData';
import type { SalesOrderHeader, SalesOrderLineItem, SalesOrderListRow, SalesOrderStatus } from '../types';
import { recordDocumentId } from '../../repository/recordDocumentId';
import type { SalesOrderApiLine, SalesOrderRecord, SaveSalesOrderInput } from './types';

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

export function apiLineToUi(line: SalesOrderApiLine, index: number): SalesOrderLineItem {
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

export function uiLineToApi(line: SalesOrderLineItem, interState = false): SalesOrderApiLine {
  const taxPercent = (line.cgstPercent || 0) + (line.sgstPercent || 0) + (line.igstPercent || 0);
  const gross = line.qty * line.rate;
  const discValue = gross * ((line.discPercent || 0) / 100);
  const taxable = Math.max(0, gross - discValue);
  const tax = taxable * (taxPercent / 100);
  const amount = taxable + tax;
  return {
    sr: line.sr,
    productRetailCode: line.productRetailCode,
    itemDescription: line.itemDescription,
    qty: String(line.qty),
    rate: String(line.rate),
    discPercent: String(line.discPercent),
    discValue: discValue.toFixed(2),
    taxType: interState ? 'IGST' : 'GST',
    taxPercent: String(taxPercent),
    amount: amount.toFixed(2),
  };
}

function billingGstinFromRecord(record: SalesOrderRecord): string {
  const billing = record.billingAddress?.trim() ?? '';
  if (billing.startsWith('GSTIN:')) return billing.replace('GSTIN:', '').trim();
  return '';
}

export function recordToHeader(record: SalesOrderRecord): SalesOrderHeader {
  const orderDate = record.soDate
    ? new Date(record.soDate).toISOString().slice(0, 10)
    : new Date().toISOString().slice(0, 10);
  const legacyGstin = billingGstinFromRecord(record);
  const billingAddress = legacyGstin ? '' : (record.billingAddress ?? '');
  return {
    entryDocPrefix: record.soPrefix || 'SO',
    billNo: String(record.docNo ?? ''),
    customer: record.customer || '',
    salesMan: record.salesMan ?? '',
    orderDate,
    paymentTerms: record.paymentTerms ?? '',
    dueDate: orderDate,
    billingAddress,
    shippingAddress: record.shippingAddress ?? '',
    sellerGstin: '24AABCU9603R1ZM',
    customerGstin: legacyGstin,
    placeOfSupply: record.placeOfSupply ?? '24-Gujarat',
    deliveryPriority: record.deliveryPriority?.trim() || 'Select',
    status: normalizeSalesOrderStatus(record.status),
    narration: record.narration ?? '',
  };
}

function normalizeSalesOrderStatus(value?: string): SalesOrderStatus {
  const s = String(value ?? 'open').toLowerCase();
  if (
    s === 'draft' ||
    s === 'open' ||
    s === 'confirmed' ||
    s === 'picking' ||
    s === 'shipped' ||
    s === 'closed' ||
    s === 'cancelled'
  ) {
    return s;
  }
  return 'open';
}

function capitalizeStatus(status: string): string {
  const s = status.toLowerCase();
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export function recordToLines(record: SalesOrderRecord): SalesOrderLineItem[] {
  const raw = record.lines ?? [];
  if (raw.length === 0) return [];
  return raw.map((l, i) => apiLineToUi(l, i));
}

export function recordToListRow(record: SalesOrderRecord): SalesOrderListRow {
  const header = recordToHeader(record);
  const amount =
    record.orderAmount != null
      ? formatDisplay(record.orderAmount)
      : formatDisplay(computeTotals(recordToLines(record), taxContextFromHeader(header)).invoiceTotal);
  return {
    id: recordDocumentId(record),
    billNo: record.formattedDocNo || `${record.soPrefix}-${record.docNo}`,
    date: formatListDate(record.soDate ?? record.createdAt),
    customer: record.customer,
    amount,
    status: capitalizeStatus(record.status ?? 'open'),
  };
}

/** Map API list summary rows (GET /api/sales-orders) to grid rows. */
export function listSummaryToListRow(item: SalesOrderListSummary): SalesOrderListRow {
  const billNo =
    item.formattedDocNo?.trim() ||
    (item.soPrefix && item.docNo != null ? `${item.soPrefix}-${item.docNo}` : '');
  return {
    id: String(item.id ?? '').trim(),
    billNo,
    date: formatListDate(item.soDate ?? item.billDate),
    customer: item.customer ?? '',
    amount: formatDisplay(item.salesAmount ?? 0),
    status: capitalizeStatus(item.status ?? 'open'),
  };
}

export function mapApiRecord(raw: Record<string, unknown>): SalesOrderRecord {
  return {
    ...(raw as unknown as SalesOrderRecord),
    _id: String(raw._id ?? raw.id ?? ''),
  };
}

export function buildSavePayload(input: SaveSalesOrderInput): Record<string, unknown> {
  const { header, lines } = input;
  const taxHeader = taxContextFromHeader({
    placeOfSupply: header.placeOfSupply,
    sellerGstin: header.sellerGstin,
    customerGstin: header.customerGstin,
  });
  const interState = isInterStateSupply(taxHeader);
  const totals = computeTotals(lines, taxHeader);
  const docNo = parseInt(header.billNo, 10) || 0;
  const soPrefix = (header.entryDocPrefix || 'SO').trim().toUpperCase();
  const orderDate = toIsoDate(header.orderDate);
  const salesMan = getAuthSession()?.user?.fullName ?? '';
  const deliveryPriority =
    !header.deliveryPriority?.trim() || header.deliveryPriority === 'Select'
      ? 'Normal'
      : header.deliveryPriority.trim();
  return {
    soPrefix,
    docNo: docNo || undefined,
    customer: header.customer,
    salesMan: header.salesMan?.trim() || salesMan,
    narration: header.narration,
    soDate: orderDate,
    billDate: header.orderDate ? formatBillDate(header.orderDate) : undefined,
    paymentTerms: header.paymentTerms,
    deliveryPriority,
    billingAddress: header.billingAddress?.trim() ?? '',
    shippingAddress: header.shippingAddress?.trim() ?? '',
    placeOfSupply: header.placeOfSupply,
    status: 'open',
    lines: lines.filter((line) => line.qty > 0).map((line) => uiLineToApi(line, interState)),
    totals: {
      totQty: String(lines.reduce((s, l) => s + (Number(l.qty) || 0), 0)),
      net: String(totals.invoiceTotal),
      orderAmount: String(totals.invoiceTotal),
      saleAmount: String(totals.invoiceTotal),
      gross: String(totals.invoiceTotal),
      discount: String(totals.totalDiscount),
      receivableToCustomer: String(totals.invoiceTotal),
    },
    orderAmount: totals.invoiceTotal,
  };
}

function formatBillDate(isoDate: string): string {
  const d = new Date(isoDate);
  if (Number.isNaN(d.getTime())) return isoDate;
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  return `${dd}/${mm}/${d.getFullYear()}`;
}

export function createNewDocumentState(lineCount = 0) {
  return { header: createDefaultHeader(), lines: lineCount > 0 ? createEmptyLines(lineCount) : [] };
}

export function serializeDocumentBaseline(header: SalesOrderHeader, lines: SalesOrderLineItem[]): string {
  return JSON.stringify({ header, lines });
}

export function recordToEditor(record: SalesOrderRecord) {
  return {
    documentId: record._id,
    header: recordToHeader(record),
    lines: recordToLines(record),
  };
}

export function recordToUiSnapshot(record: SalesOrderRecord): SalesOrderUiSnapshot {
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
