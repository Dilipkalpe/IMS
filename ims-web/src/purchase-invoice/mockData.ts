import { INDIAN_STATE_OPTIONS } from '../sales-invoice/gstTax';
import { PAYMENT_MODES, PAYMENT_TYPES } from '../sales-invoice/invoicePayment';
import { createSampleLine, createSampleLines } from '../sales-invoice/mockData';
import type { PurchaseInvoiceHeader, PurchaseInvoiceListRow } from './types';

export { createSampleLine, createSampleLines };

export const SAMPLE_SUPPLIERS = [
  'Gujarat Textiles Ltd',
  'Metro Yarn Suppliers',
  'Walk-in Supplier',
  'Sharma Fabrics Wholesale',
];

export const PLACE_OF_SUPPLY: string[] = [...INDIAN_STATE_OPTIONS];
export { PAYMENT_TYPES, PAYMENT_MODES };

export function createDefaultHeader(): PurchaseInvoiceHeader {
  const today = new Date().toISOString().slice(0, 10);
  return {
    entryDocPrefix: 'PI',
    billNo: '',
    supplier: SAMPLE_SUPPLIERS[0],
    invoiceDate: today,
    grnReference: '',
    dueDate: today,
    companyGstin: '24AABCU9603R1ZM',
    supplierGstin: '',
    placeOfSupply: '24-Gujarat',
    paymentType: 'Credit',
    paymentMode: 'Cash',
    paidAmount: 0,
    narration: '',
  };
}

export const SAMPLE_LIST_ROWS: PurchaseInvoiceListRow[] = [
  { id: '1', billNo: 'PI-842', date: '04-06-2026', supplier: 'Gujarat Textiles Ltd', amount: '38,520.00', status: 'Posted' },
  { id: '2', billNo: 'PI-841', date: '03-06-2026', supplier: 'Metro Yarn Suppliers', amount: '9,340.00', status: 'Posted' },
  { id: '3', billNo: 'PI-840', date: '02-06-2026', supplier: 'Walk-in Supplier', amount: '1,180.00', status: 'Draft' },
];
