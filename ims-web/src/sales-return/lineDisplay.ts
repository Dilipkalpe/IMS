import {
  buildLineDisplay as buildSalesLineDisplay,
  buildLineDisplayMap as buildSalesLineDisplayMap,
} from '../sales-invoice/lineDisplay';
import { taxContextFromHeader } from '../sales-invoice/calculations';
import type { SalesReturnHeader, SalesReturnLineItem } from './types';

export type { SalesInvoiceLineDisplay as SalesReturnLineDisplay } from '../sales-invoice/lineDisplay';

function taxHeader(h: SalesReturnHeader) {
  return taxContextFromHeader({
    placeOfSupply: h.placeOfSupply,
    sellerGstin: h.sellerGstin,
    customerGstin: h.customerGstin,
  });
}

export function buildLineDisplay(line: SalesReturnLineItem, header?: SalesReturnHeader) {
  return buildSalesLineDisplay(line, header ? taxHeader(header) : undefined);
}

export function buildLineDisplayMap(lines: SalesReturnLineItem[], header?: SalesReturnHeader) {
  return buildSalesLineDisplayMap(lines, header ? taxHeader(header) : undefined);
}
