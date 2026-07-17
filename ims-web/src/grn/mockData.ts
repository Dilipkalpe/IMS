import { INDIAN_STATE_OPTIONS } from '../sales-invoice/gstTax';
import { createSampleLine, createSampleLines } from '../sales-invoice/mockData';
import type { GrnHeader, GrnLineItem, GrnListRow } from './types';

export { createSampleLine };

export function createSampleGrnLines(count: number): GrnLineItem[] {
  return createSampleLines(count).map((l) => ({ ...l }));
}

export const SAMPLE_SUPPLIERS = [
  'Gujarat Textiles Ltd',
  'Metro Yarn Suppliers',
  'Walk-in Supplier',
  'Sharma Fabrics Wholesale',
];

export const SAMPLE_BUYERS = ['IMS Main Store', 'Unit-2 Warehouse', '—'];
export const SAMPLE_WAREHOUSES = ['Main Godown', 'Unit-2 Store', 'Raw Material Bay'];

export const PLACE_OF_SUPPLY: string[] = [...INDIAN_STATE_OPTIONS];

export function createDefaultHeader(): GrnHeader {
  const today = new Date().toISOString().slice(0, 10);
  return {
    entryDocPrefix: 'GRN',
    billNo: '',
    supplier: SAMPLE_SUPPLIERS[0],
    grnDate: today,
    poReference: '',
    warehouse: SAMPLE_WAREHOUSES[0],
    vehicleNo: '',
    transporter: '',
    buyer: SAMPLE_BUYERS[0],
    companyGstin: '24AABCU9603R1ZM',
    supplierGstin: '',
    placeOfSupply: '24-Gujarat',
    narration: '',
  };
}

export const SAMPLE_LIST_ROWS: GrnListRow[] = [
  { id: '1', billNo: 'GRN-842', date: '04-06-2026', supplier: 'Gujarat Textiles Ltd', poReference: 'PO-1205', amount: '38,520.00', status: 'Open' },
  { id: '2', billNo: 'GRN-841', date: '03-06-2026', supplier: 'Metro Yarn Suppliers', poReference: 'PO-1204', amount: '9,340.00', status: 'Posted' },
  { id: '3', billNo: 'GRN-840', date: '02-06-2026', supplier: 'Walk-in Supplier', poReference: '', amount: '1,180.00', status: 'Draft' },
];
