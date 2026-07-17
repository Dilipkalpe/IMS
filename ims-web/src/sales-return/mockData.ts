import { DEFAULT_NEW_DOCUMENT_CUSTOMER } from '../components/transaction/salesCustomerPicker';
import { INDIAN_STATE_OPTIONS } from '../sales-invoice/gstTax';
import { createSampleLine, createSampleLines } from '../sales-invoice/mockData';
import type { SalesReturnHeader, SalesReturnListRow } from './types';

export { createSampleLine, createSampleLines };

export const SAMPLE_CUSTOMERS = [
  'Raj Cloth Center',
  'Metro Traders Pvt Ltd',
  'Walk-in Customer',
  'Sharma Garments',
];

export const PLACE_OF_SUPPLY: string[] = [...INDIAN_STATE_OPTIONS];
export const RETURN_WAREHOUSES = ['Main Godown', 'Unit-2 Store', 'QC Hold Bay'];
export const QC_REMARKS = ['Normal', 'Damaged', 'Expired', 'Wrong item'];

export function createDefaultHeader(): SalesReturnHeader {
  const today = new Date().toISOString().slice(0, 10);
  return {
    entryDocPrefix: 'SR',
    billNo: '',
    customer: DEFAULT_NEW_DOCUMENT_CUSTOMER,
    returnDate: today,
    invoiceReference: '',
    returnReason: '',
    returnWarehouse: RETURN_WAREHOUSES[0],
    sellerGstin: '24AABCU9603R1ZM',
    customerGstin: '',
    placeOfSupply: '24-Gujarat',
    qcRemark: QC_REMARKS[0],
    narration: '',
  };
}

export const SAMPLE_LIST_ROWS: SalesReturnListRow[] = [
  { id: '1', billNo: 'SR-1205', date: '04-06-2026', customer: 'Raj Cloth Center', amount: '42,100.00', status: 'Open' },
  { id: '2', billNo: 'SR-1204', date: '03-06-2026', customer: 'Metro Traders Pvt Ltd', amount: '18,750.00', status: 'Confirmed' },
  { id: '3', billNo: 'SR-1203', date: '02-06-2026', customer: 'Walk-in Customer', amount: '3,420.00', status: 'Draft' },
];
