import {
  buildLineDisplay as buildSalesLineDisplay,
  buildLineDisplayMap as buildSalesLineDisplayMap,
} from '../sales-invoice/lineDisplay';
import type { GrnHeader, GrnLineItem } from './types';
import { grnTaxHeader } from './taxContext';

export type { SalesInvoiceLineDisplay as GrnLineDisplay } from '../sales-invoice/lineDisplay';

export function buildLineDisplay(line: GrnLineItem, header?: GrnHeader) {
  return buildSalesLineDisplay(line, header ? grnTaxHeader(header) : undefined);
}

export function buildLineDisplayMap(lines: GrnLineItem[], header?: GrnHeader) {
  return buildSalesLineDisplayMap(lines, header ? grnTaxHeader(header) : undefined);
}
