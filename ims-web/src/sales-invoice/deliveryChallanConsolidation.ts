import type { DeliveryChallanReference, PendingInvoiceLineDto } from '../api/deliveryChallans';
import { formatNumberedDocReferenceText } from '../components/transaction/documentLineReferences';
import {
  interStateFromSalesHeader,
  lineTaxPercentsFromProduct,
  parseTaxPercent,
} from '../components/transaction/salesProductLines';
import type { SalesInvoiceHeader, SalesInvoiceLineItem } from './types';

function num(v: string | number | undefined): number {
  if (typeof v === 'number') return v;
  const n = parseFloat(String(v ?? '0').replace(/,/g, ''));
  return Number.isFinite(n) ? n : 0;
}

export function formatDeliveryChallanStatus(status: string): string {
  switch (status) {
    case 'partially_invoiced':
      return 'Partially Invoiced';
    case 'fully_invoiced':
      return 'Fully Invoiced';
    case 'open':
      return 'Open';
    case 'posted':
      return 'Posted';
    case 'dispatched':
      return 'Dispatched';
    case 'shipped':
      return 'Shipped';
    case 'confirmed':
      return 'Confirmed';
    default:
      return status;
  }
}

export function formatDeliveryChallanDate(iso?: string): string {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const yyyy = d.getFullYear();
  return `${dd}/${mm}/${yyyy}`;
}

export function buildDcReferenceText(challans: readonly DeliveryChallanReference[]): string {
  return formatNumberedDocReferenceText(challans);
}

export function mapPendingInvoiceLinesToSiLines(
  lines: PendingInvoiceLineDto[],
  header: SalesInvoiceHeader,
): SalesInvoiceLineItem[] {
  const interState = interStateFromSalesHeader(header);

  const sorted = [...lines].sort((a, b) => {
    const docCmp = (a.dcFormattedDocNo ?? '').localeCompare(b.dcFormattedDocNo ?? '', undefined, {
      sensitivity: 'accent',
    });
    if (docCmp !== 0) return docCmp;
    return (a.dcLineSr ?? 0) - (b.dcLineSr ?? 0);
  });

  return sorted.map((line, index) => {
    const sr = index + 1;
    const taxPct = parseTaxPercent(line.taxPercent);
    const tax = lineTaxPercentsFromProduct(taxPct, interState);
    return {
      id: `line-${crypto.randomUUID()}`,
      sr,
      productRetailCode: line.productRetailCode ?? '',
      itemDescription: line.itemDescription ?? '',
      qty: num(line.qty),
      rate: num(line.rate),
      salesRate: num(line.salesRate) || num(line.rate),
      discPercent: num(line.discPercent),
      ...tax,
      dcPrefix: line.dcPrefix,
      dcDocNo: line.dcDocNo,
      dcFormattedDocNo: line.dcFormattedDocNo,
      dcLineSr: line.dcLineSr,
      dcDeliveredQty: num(line.dcDeliveredQty),
      dcPendingQty: num(line.dcPendingQty),
    };
  });
}
