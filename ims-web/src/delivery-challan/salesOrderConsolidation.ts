import type { PendingDeliveryLineDto, SalesOrderReference } from '../api/salesOrders';
import { formatNumberedDocReferenceText } from '../components/transaction/documentLineReferences';
import {
  interStateFromSalesHeader,
  lineTaxPercentsFromProduct,
  parseTaxPercent,
} from '../components/transaction/salesProductLines';
import type { DeliveryChallanHeader, DeliveryChallanLineItem } from './types';

function num(v: string | number | undefined): number {
  if (typeof v === 'number') return v;
  const n = parseFloat(String(v ?? '0').replace(/,/g, ''));
  return Number.isFinite(n) ? n : 0;
}

export function formatSalesOrderStatus(status: string): string {
  switch (status) {
    case 'partially_delivered':
      return 'Partially Delivered';
    case 'fully_delivered':
      return 'Fully Delivered';
    case 'open':
      return 'Open';
    default:
      return status;
  }
}

export function formatSalesOrderDate(iso?: string): string {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const yyyy = d.getFullYear();
  return `${dd}/${mm}/${yyyy}`;
}

export function buildSoReferenceText(orders: readonly SalesOrderReference[]): string {
  return formatNumberedDocReferenceText(orders);
}

export function mapPendingDeliveryLinesToDcLines(
  lines: PendingDeliveryLineDto[],
  header: DeliveryChallanHeader,
): DeliveryChallanLineItem[] {
  const interState = interStateFromSalesHeader(header);

  const sorted = [...lines].sort((a, b) => {
    const docCmp = (a.soFormattedDocNo ?? '').localeCompare(b.soFormattedDocNo ?? '', undefined, {
      sensitivity: 'accent',
    });
    if (docCmp !== 0) return docCmp;
    return (a.soLineSr ?? 0) - (b.soLineSr ?? 0);
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
      soPrefix: line.soPrefix,
      soDocNo: line.soDocNo,
      soFormattedDocNo: line.soFormattedDocNo,
      soLineSr: line.soLineSr,
      soOrderedQty: num(line.soOrderedQty),
      soPendingQty: num(line.soPendingQty),
    };
  });
}
