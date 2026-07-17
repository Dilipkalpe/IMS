import {
  buildLineDisplay as buildSalesLineDisplay,
  buildLineDisplayMap as buildSalesLineDisplayMap,
} from '../sales-invoice/lineDisplay';
import type { DeliveryChallanHeader, DeliveryChallanLineItem } from './types';
import { dcTaxHeader } from './taxContext';

export type { SalesInvoiceLineDisplay as DeliveryChallanLineDisplay } from '../sales-invoice/lineDisplay';

export function buildLineDisplay(line: DeliveryChallanLineItem, header?: DeliveryChallanHeader) {
  return buildSalesLineDisplay(line, header ? dcTaxHeader(header) : undefined);
}

export function buildLineDisplayMap(lines: DeliveryChallanLineItem[], header?: DeliveryChallanHeader) {
  return buildSalesLineDisplayMap(lines, header ? dcTaxHeader(header) : undefined);
}
