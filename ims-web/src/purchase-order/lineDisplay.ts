import {
  buildLineDisplay as buildSalesLineDisplay,
  buildLineDisplayMap as buildSalesLineDisplayMap,
} from '../sales-invoice/lineDisplay';
import type { PurchaseOrderHeader, PurchaseOrderLineItem } from './types';
import { purchaseOrderTaxHeader } from './taxContext';

export type { SalesInvoiceLineDisplay as PurchaseOrderLineDisplay } from '../sales-invoice/lineDisplay';

export function buildLineDisplay(line: PurchaseOrderLineItem, header?: PurchaseOrderHeader) {
  return buildSalesLineDisplay(line, header ? purchaseOrderTaxHeader(header) : undefined);
}

export function buildLineDisplayMap(lines: PurchaseOrderLineItem[], header?: PurchaseOrderHeader) {
  return buildSalesLineDisplayMap(lines, header ? purchaseOrderTaxHeader(header) : undefined);
}
