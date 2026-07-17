import {
  buildLineDisplay as buildSalesLineDisplay,
  buildLineDisplayMap as buildSalesLineDisplayMap,
} from '../sales-invoice/lineDisplay';
import { purchaseTaxHeader } from './taxContext';
import type { PurchaseInvoiceHeader, PurchaseInvoiceLineItem } from './types';

export type { SalesInvoiceLineDisplay as PurchaseInvoiceLineDisplay } from '../sales-invoice/lineDisplay';

export function buildLineDisplay(line: PurchaseInvoiceLineItem, header?: PurchaseInvoiceHeader) {
  return buildSalesLineDisplay(line, header ? purchaseTaxHeader(header) : undefined);
}

export function buildLineDisplayMap(lines: PurchaseInvoiceLineItem[], header?: PurchaseInvoiceHeader) {
  return buildSalesLineDisplayMap(lines, header ? purchaseTaxHeader(header) : undefined);
}
