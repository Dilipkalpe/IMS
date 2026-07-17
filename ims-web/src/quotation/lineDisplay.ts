import {
  buildLineDisplay as buildSalesLineDisplay,
  buildLineDisplayMap as buildSalesLineDisplayMap,
} from '../sales-invoice/lineDisplay';
import { taxContextFromHeader } from '../sales-invoice/calculations';
import type { QuotationHeader, QuotationLineItem } from './types';

export type { SalesInvoiceLineDisplay as QuotationLineDisplay } from '../sales-invoice/lineDisplay';

function taxHeader(h: QuotationHeader) {
  return taxContextFromHeader({
    placeOfSupply: h.placeOfSupply,
    sellerGstin: h.sellerGstin,
    customerGstin: h.customerGstin,
  });
}

export function buildLineDisplay(line: QuotationLineItem, header?: QuotationHeader) {
  return buildSalesLineDisplay(line, header ? taxHeader(header) : undefined);
}

export function buildLineDisplayMap(lines: QuotationLineItem[], header?: QuotationHeader) {
  return buildSalesLineDisplayMap(lines, header ? taxHeader(header) : undefined);
}
