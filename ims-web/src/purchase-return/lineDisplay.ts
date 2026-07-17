import {
  buildLineDisplay as buildSalesLineDisplay,
  buildLineDisplayMap as buildSalesLineDisplayMap,
} from '../sales-invoice/lineDisplay';
import type { PurchaseReturnHeader, PurchaseReturnLineItem } from './types';
import { purchaseReturnGstContext } from './taxContext';

export type { SalesInvoiceLineDisplay as PurchaseReturnLineDisplay } from '../sales-invoice/lineDisplay';

export function buildLineDisplay(line: PurchaseReturnLineItem, header?: PurchaseReturnHeader) {
  return buildSalesLineDisplay(line, header ? purchaseReturnGstContext(header) : undefined);
}

export function buildLineDisplayMap(lines: PurchaseReturnLineItem[], header?: PurchaseReturnHeader) {
  return buildSalesLineDisplayMap(lines, header ? purchaseReturnGstContext(header) : undefined);
}
