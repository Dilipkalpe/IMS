import { DEFAULT_NEW_DOCUMENT_CUSTOMER } from '../components/transaction/salesCustomerPicker';
import { INDIAN_STATE_OPTIONS } from '../sales-invoice/gstTax';
import { createSampleLine, createSampleLines } from '../sales-invoice/mockData';
import type { QuotationHeader, QuotationListRow } from './types';

export { createSampleLine, createSampleLines };

export const SAMPLE_CUSTOMERS = [
  'Raj Cloth Center',
  'Metro Traders Pvt Ltd',
  'Walk-in Customer',
  'Sharma Garments',
];

export const PLACE_OF_SUPPLY: string[] = [...INDIAN_STATE_OPTIONS];

function defaultValidUntil(from: string): string {
  const d = new Date(from);
  d.setDate(d.getDate() + 30);
  return d.toISOString().slice(0, 10);
}

export function createDefaultHeader(): QuotationHeader {
  const today = new Date().toISOString().slice(0, 10);
  return {
    entryDocPrefix: 'QT',
    billNo: '',
    customer: DEFAULT_NEW_DOCUMENT_CUSTOMER,
    quoteDate: today,
    paymentTerms: 'Net 30',
    sellerGstin: '24AABCU9603R1ZM',
    customerGstin: '',
    placeOfSupply: '24-Gujarat',
    validUntil: defaultValidUntil(today),
    narration: '',
  };
}

export const SAMPLE_LIST_ROWS: QuotationListRow[] = [
  { id: '1', billNo: 'QT-1205', date: '04-06-2026', customer: 'Raj Cloth Center', amount: '42,100.00', status: 'Open' },
  { id: '2', billNo: 'QT-1204', date: '03-06-2026', customer: 'Metro Traders Pvt Ltd', amount: '18,750.00', status: 'Sent' },
  { id: '3', billNo: 'QT-1203', date: '02-06-2026', customer: 'Walk-in Customer', amount: '3,420.00', status: 'Draft' },
];
