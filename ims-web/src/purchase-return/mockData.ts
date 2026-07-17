import { INDIAN_STATE_OPTIONS } from '../sales-invoice/gstTax';
import { createSampleLine, createSampleLines } from '../sales-invoice/mockData';
import type { PurchaseReturnHeader, PurchaseReturnListRow } from './types';

export { createSampleLine, createSampleLines };

export const SAMPLE_SUPPLIERS = [
  'Gujarat Textile Mills',
  'Shree Fabrics Ltd',
  'Metro Yarn Suppliers',
  'Patel Trading Co',
];

export const PLACE_OF_SUPPLY: string[] = [...INDIAN_STATE_OPTIONS];
export const RETURN_WAREHOUSES = ['Main Godown', 'Unit-2 Store', 'QC Hold Bay'];
export const QC_REMARKS = ['Normal', 'Damaged', 'Expired', 'Wrong item'];

export function createDefaultHeader(): PurchaseReturnHeader {
  const today = new Date().toISOString().slice(0, 10);
  return {
    entryDocPrefix: 'PR',
    billNo: '',
    supplier: SAMPLE_SUPPLIERS[0],
    returnDate: today,
    invoiceReference: '',
    returnReason: '',
    returnWarehouse: RETURN_WAREHOUSES[0],
    companyGstin: '24AABCU9603R1ZM',
    supplierGstin: '',
    placeOfSupply: '24-Gujarat',
    qcRemark: QC_REMARKS[0],
    narration: '',
  };
}

export const SAMPLE_LIST_ROWS: PurchaseReturnListRow[] = [
  { id: '1', billNo: 'PR-1205', date: '04-06-2026', supplier: 'Gujarat Textile Mills', amount: '42,100.00', status: 'Open' },
  { id: '2', billNo: 'PR-1204', date: '03-06-2026', supplier: 'Shree Fabrics Ltd', amount: '18,750.00', status: 'Confirmed' },
  { id: '3', billNo: 'PR-1203', date: '02-06-2026', supplier: 'Metro Yarn Suppliers', amount: '3,420.00', status: 'Draft' },
];
