import { INDIAN_STATE_OPTIONS } from '../sales-invoice/gstTax';
import { createSampleLine, createSampleLines } from '../sales-invoice/mockData';
import type { PurchaseOrderHeader, PurchaseOrderListRow } from './types';

export { createSampleLine, createSampleLines };

export const SAMPLE_SUPPLIERS = [
  'Gujarat Textiles Ltd',
  'Metro Yarn Suppliers',
  'Walk-in Supplier',
  'Sharma Fabrics Wholesale',
];

export const PLACE_OF_SUPPLY: string[] = [...INDIAN_STATE_OPTIONS];
export const DELIVERY_PRIORITIES = ['Normal', 'High', 'Urgent'];

export function createDefaultHeader(): PurchaseOrderHeader {
  const today = new Date().toISOString().slice(0, 10);
  return {
    entryDocPrefix: 'PO',
    billNo: '',
    supplier: SAMPLE_SUPPLIERS[0],
    orderDate: today,
    paymentTerms: '',
    dueDate: today,
    companyGstin: '24AABCU9603R1ZM',
    supplierGstin: '',
    placeOfSupply: '24-Gujarat',
    deliveryPriority: 'Normal',
    narration: '',
  };
}

export const SAMPLE_LIST_ROWS: PurchaseOrderListRow[] = [
  { id: '1', billNo: 'PO-1205', date: '04-06-2026', supplier: 'Gujarat Textiles Ltd', amount: '42,100.00', status: 'Open' },
  { id: '2', billNo: 'PO-1204', date: '03-06-2026', supplier: 'Metro Yarn Suppliers', amount: '18,750.00', status: 'Confirmed' },
  { id: '3', billNo: 'PO-1203', date: '02-06-2026', supplier: 'Walk-in Supplier', amount: '3,420.00', status: 'Draft' },
];
