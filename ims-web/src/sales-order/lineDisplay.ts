import {
  buildLineDisplay as buildSalesLineDisplay,
  buildLineDisplayMap as buildSalesLineDisplayMap,
} from '../sales-invoice/lineDisplay';
import { taxContextFromHeader } from '../sales-invoice/calculations';
import type { SalesOrderHeader, SalesOrderLineItem } from './types';

export type { SalesInvoiceLineDisplay as SalesOrderLineDisplay } from '../sales-invoice/lineDisplay';

function taxHeader(h: SalesOrderHeader) {
  return taxContextFromHeader({
    placeOfSupply: h.placeOfSupply,
    sellerGstin: h.sellerGstin,
    customerGstin: h.customerGstin,
  });
}

export function buildLineDisplay(line: SalesOrderLineItem, header?: SalesOrderHeader) {
  return buildSalesLineDisplay(line, header ? taxHeader(header) : undefined);
}

export function buildLineDisplayMap(lines: SalesOrderLineItem[], header?: SalesOrderHeader) {
  return buildSalesLineDisplayMap(lines, header ? taxHeader(header) : undefined);
}
