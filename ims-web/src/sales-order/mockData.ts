import { INDIAN_STATE_OPTIONS } from '../sales-invoice/gstTax';
import { createSampleLine, createSampleLines } from '../sales-invoice/mockData';
import type { SalesOrderHeader, SalesOrderLineItem, SalesOrderListRow } from './types';

export { createSampleLine, createSampleLines };

/** Blank line row for manual entry on new orders. */
export function createEmptyLine(sr: number): SalesOrderLineItem {
  return {
    id: `line-${sr}-${crypto.randomUUID()}`,
    sr,
    productRetailCode: '',
    itemDescription: '',
    qty: 0,
    rate: 0,
    salesRate: 0,
    discPercent: 0,
    cgstPercent: 0,
    sgstPercent: 0,
    igstPercent: 0,
  };
}

export function createEmptyLines(count: number): SalesOrderLineItem[] {
  return Array.from({ length: count }, (_, i) => createEmptyLine(i + 1));
}

export const SAMPLE_CUSTOMERS = [
  'Raj Cloth Center',
  'Metro Traders Pvt Ltd',
  'Walk-in Customer',
  'Sharma Garments',
];

export const PLACE_OF_SUPPLY: string[] = [...INDIAN_STATE_OPTIONS];
export const DELIVERY_PRIORITIES = ['Select', 'Normal', 'Urgent', 'Express'];

export const SALES_ORDER_STATUS_FILTERS = [
  'All',
  'Open',
  'Partially Delivered',
  'Fully Delivered',
  'Confirmed',
  'Picking',
  'Shipped',
  'Closed',
  'Cancelled',
  'Draft',
] as const;

export function createDefaultHeader(): SalesOrderHeader {
  const today = new Date().toISOString().slice(0, 10);
  return {
    entryDocPrefix: 'SO',
    billNo: '',
    customer: '',
    salesMan: '',
    orderDate: today,
    paymentTerms: '',
    dueDate: today,
    billingAddress: '',
    shippingAddress: '',
    sellerGstin: '24AABCU9603R1ZM',
    customerGstin: '',
    placeOfSupply: '24-Gujarat',
    deliveryPriority: 'Select',
    status: 'open',
    narration: '',
  };
}

export const SALES_ORDER_STATUSES = [
  { value: 'draft', label: 'Draft' },
  { value: 'open', label: 'Open' },
  { value: 'confirmed', label: 'Confirmed' },
  { value: 'picking', label: 'Picking' },
  { value: 'shipped', label: 'Shipped' },
  { value: 'closed', label: 'Closed' },
  { value: 'cancelled', label: 'Cancelled' },
] as const;

export const SAMPLE_LIST_ROWS: SalesOrderListRow[] = [
  { id: '1', billNo: 'SO-1205', date: '04-06-2026', customer: 'Raj Cloth Center', amount: '42,100.00', status: 'Open' },
  { id: '2', billNo: 'SO-1204', date: '03-06-2026', customer: 'Metro Traders Pvt Ltd', amount: '18,750.00', status: 'Confirmed' },
  { id: '3', billNo: 'SO-1203', date: '02-06-2026', customer: 'Walk-in Customer', amount: '3,420.00', status: 'Draft' },
];
