import { isInterStateSupply, taxContextFromHeader } from '../../sales-invoice/calculations';
import type { SalesInvoiceLineItem } from '../../sales-invoice/types';
import type { SalesProductInfo } from './salesProductPicker';

export type { SalesProductInfo };

export interface GstSalesHeader {
  placeOfSupply?: string;
  sellerGstin?: string;
  customerGstin?: string;
}

export function parseTaxPercent(raw: string | number | undefined): number {
  const n = typeof raw === 'number' ? raw : parseFloat(String(raw ?? '0'));
  return Number.isFinite(n) && n > 0 ? n : 18;
}

export function lineTaxPercentsFromProduct(
  taxPercent: number,
  interState: boolean,
): Pick<SalesInvoiceLineItem, 'cgstPercent' | 'sgstPercent' | 'igstPercent'> {
  if (taxPercent <= 0) {
    return { cgstPercent: 0, sgstPercent: 0, igstPercent: 0 };
  }
  if (interState) {
    return { cgstPercent: 0, sgstPercent: 0, igstPercent: taxPercent };
  }
  const half = taxPercent / 2;
  return { cgstPercent: half, sgstPercent: half, igstPercent: 0 };
}

export function interStateFromSalesHeader(header: GstSalesHeader): boolean {
  return isInterStateSupply(
    taxContextFromHeader({
      placeOfSupply: header.placeOfSupply ?? '',
      sellerGstin: header.sellerGstin ?? '',
      customerGstin: header.customerGstin ?? '',
    }),
  );
}

export function createBlankSalesLine(sr: number): SalesInvoiceLineItem {
  return {
    id: `line-${crypto.randomUUID()}`,
    sr,
    productRetailCode: '',
    itemDescription: '',
    qty: 1,
    rate: 0,
    salesRate: 0,
    discPercent: 0,
    cgstPercent: 0,
    sgstPercent: 0,
    igstPercent: 0,
  };
}

export function addOrIncrementSalesLine<L extends SalesInvoiceLineItem>(
  lines: L[],
  product: SalesProductInfo,
  interState: boolean,
  createBlankLine: (sr: number) => L,
  resolvedRate?: number,
): L[] {
  const idx = lines.findIndex(
    (l) =>
      l.productRetailCode.localeCompare(product.code, undefined, { sensitivity: 'accent' }) === 0,
  );

  if (idx >= 0) {
    return lines.map((l, i) => (i === idx ? { ...l, qty: l.qty + 1 } : l));
  }

  const sr = lines.length + 1;
  const tax = lineTaxPercentsFromProduct(parseTaxPercent(product.taxPercent), interState);
  const base = createBlankLine(sr);
  const rate = resolvedRate ?? product.rate;

  return [
    ...lines,
    {
      ...base,
      sr,
      productRetailCode: product.code,
      itemDescription: product.name,
      ...(typeof product.stockQty === 'number' ? { balStk: product.stockQty } : {}),
      qty: 1,
      rate,
      salesRate: rate,
      discPercent: 0,
      ...tax,
    },
  ];
}

/** WPF: unknown scan → P{sr:D4}, description = input, rate 0, default 18% GST. */
export function addUnknownScanSalesLine<L extends SalesInvoiceLineItem>(
  lines: L[],
  term: string,
  interState: boolean,
  createBlankLine: (sr: number) => L,
): L[] {
  const sr = lines.length + 1;
  const base = createBlankLine(sr);
  const code = `P${String(sr).padStart(4, '0')}`;
  const tax = lineTaxPercentsFromProduct(18, interState);

  return [
    ...lines,
    {
      ...base,
      sr,
      productRetailCode: code,
      itemDescription: term,
      qty: 1,
      rate: 0,
      salesRate: 0,
      discPercent: 0,
      ...tax,
    },
  ];
}
