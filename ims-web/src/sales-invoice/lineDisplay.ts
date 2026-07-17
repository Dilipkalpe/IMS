import { computeLine, formatDisplay, resolveLineTaxPercents, taxContextFromHeader } from './calculations';
import { isInterStateSupply, type GstTaxContext } from './gstTax';
import type { SalesInvoiceHeader, SalesInvoiceLineItem } from './types';

export interface SalesInvoiceLineDisplay {
  taxableDisplay: string;
  cgstPercentDisplay: string;
  cgstAmountDisplay: string;
  sgstPercentDisplay: string;
  sgstAmountDisplay: string;
  igstPercentDisplay: string;
  igstAmountDisplay: string;
  lineTotalDisplay: string;
}

export function buildLineDisplay(
  line: SalesInvoiceLineItem,
  taxInput?: GstTaxContext | Pick<SalesInvoiceHeader, 'placeOfSupply' | 'sellerGstin' | 'customerGstin'>,
): SalesInvoiceLineDisplay {
  const context = taxInput
    ? 'companyStateCode' in taxInput
      ? taxInput
      : taxContextFromHeader({
          placeOfSupply: taxInput.placeOfSupply ?? '',
          sellerGstin: taxInput.sellerGstin ?? '',
          customerGstin: taxInput.customerGstin ?? '',
        })
    : undefined;
  const c = computeLine(line, context);
  const inter = context ? isInterStateSupply(context) : false;
  const percents = context ? resolveLineTaxPercents(line, inter) : {
    cgstPercent: line.cgstPercent,
    sgstPercent: line.sgstPercent,
    igstPercent: line.igstPercent,
  };
  return {
    taxableDisplay: formatDisplay(c.taxable),
    cgstPercentDisplay: formatDisplay(percents.cgstPercent),
    cgstAmountDisplay: formatDisplay(c.cgstAmount),
    sgstPercentDisplay: formatDisplay(percents.sgstPercent),
    sgstAmountDisplay: formatDisplay(c.sgstAmount),
    igstPercentDisplay: formatDisplay(percents.igstPercent),
    igstAmountDisplay: formatDisplay(c.igstAmount),
    lineTotalDisplay: formatDisplay(c.lineTotal),
  };
}

/** O(n) — called when `lines` or tax context changes. */
export function buildLineDisplayMap(
  lines: SalesInvoiceLineItem[],
  taxInput?: GstTaxContext | Pick<SalesInvoiceHeader, 'placeOfSupply' | 'sellerGstin' | 'customerGstin'>,
): Map<string, SalesInvoiceLineDisplay> {
  const map = new Map<string, SalesInvoiceLineDisplay>();
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    map.set(line.id, buildLineDisplay(line, taxInput));
  }
  return map;
}
