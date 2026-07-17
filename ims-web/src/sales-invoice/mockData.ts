import { DEFAULT_NEW_DOCUMENT_CUSTOMER } from '../components/transaction/salesCustomerPicker';
import type { SalesInvoiceHeader, SalesInvoiceLineItem, SalesInvoiceListRow } from './types';
import { INDIAN_STATE_OPTIONS } from './gstTax';
import { PAYMENT_MODES, PAYMENT_TYPES } from './invoicePayment';

export const SAMPLE_CUSTOMERS = [
  'Raj Cloth Center',
  'Metro Traders Pvt Ltd',
  'Walk-in Customer',
  'Sharma Garments',
];

/** GST state list (code-name) — aligns with WPF IndianStates.StateOptions. */
export const PLACE_OF_SUPPLY: string[] = [...INDIAN_STATE_OPTIONS];
export { PAYMENT_TYPES, PAYMENT_MODES };

export function createDefaultHeader(): SalesInvoiceHeader {
  const today = new Date().toISOString().slice(0, 10);
  return {
    entryDocPrefix: 'SI',
    billNo: '',
    customer: DEFAULT_NEW_DOCUMENT_CUSTOMER,
    invoiceDate: today,
    dcReference: '',
    dueDate: today,
    sellerGstin: '24AABCU9603R1ZM',
    customerGstin: '',
    placeOfSupply: '24-Gujarat',
    paymentType: 'Credit',
    paymentMode: 'Cash',
    paidAmount: 0,
    narration: '',
    ewayBillNo: '',
    ewayBillDate: '',
    vehicleNo: '',
    transporter: '',
    transporterId: '',
    distanceKm: '',
  };
}

export function createSampleLine(sr: number, seed: number): SalesInvoiceLineItem {
  const qty = 1 + (seed % 5);
  const rate = 100 + (seed % 20) * 25;
  return {
    id: `line-${sr}`,
    sr,
    productRetailCode: `P${1000 + seed}`,
    itemDescription: `Sample product ${seed} — cotton blend fabric`,
    qty,
    rate,
    salesRate: rate,
    discPercent: seed % 3 === 0 ? 5 : 0,
    cgstPercent: 2.5,
    sgstPercent: 2.5,
    igstPercent: 0,
  };
}

export function createSampleLines(count: number): SalesInvoiceLineItem[] {
  return Array.from({ length: count }, (_, i) => createSampleLine(i + 1, i + 1));
}

export const SAMPLE_LIST_ROWS: SalesInvoiceListRow[] = [
  { id: '1', billNo: 'SI-1042', date: '04-06-2026', customer: 'Raj Cloth Center', amount: '48,520.00', status: 'Posted' },
  { id: '2', billNo: 'SI-1041', date: '03-06-2026', customer: 'Metro Traders Pvt Ltd', amount: '12,340.00', status: 'Posted' },
  { id: '3', billNo: 'SI-1040', date: '02-06-2026', customer: 'Walk-in Customer', amount: '2,180.00', status: 'Draft' },
  { id: '4', billNo: 'SI-1039', date: '01-06-2026', customer: 'Sharma Garments', amount: '76,900.00', status: 'Posted' },
];
