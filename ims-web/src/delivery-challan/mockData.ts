import { DEFAULT_NEW_DOCUMENT_CUSTOMER } from '../components/transaction/salesCustomerPicker';
import { INDIAN_STATE_OPTIONS } from '../sales-invoice/gstTax';
import { createSampleLine, createSampleLines } from '../sales-invoice/mockData';
import type { DeliveryChallanHeader, DeliveryChallanLineItem, DeliveryChallanListRow } from './types';

export { createSampleLine };

export function createSampleDeliveryChallanLines(count: number): DeliveryChallanLineItem[] {
  return createSampleLines(count).map((l) => ({ ...l }));
}

export const SAMPLE_CUSTOMERS = [
  'Raj Cloth Center',
  'Metro Traders Pvt Ltd',
  'Walk-in Customer',
  'Sharma Garments',
];

export const SAMPLE_SALESMEN = ['Ramesh Patel', 'Suresh Mehta', '—'];
export const SAMPLE_WAREHOUSES = ['Main Godown', 'Unit-2 Store', 'Raw Material Bay'];

export const PLACE_OF_SUPPLY: string[] = [...INDIAN_STATE_OPTIONS];

export function createDefaultHeader(): DeliveryChallanHeader {
  const today = new Date().toISOString().slice(0, 10);
  return {
    entryDocPrefix: 'DC',
    billNo: '',
    customer: DEFAULT_NEW_DOCUMENT_CUSTOMER,
    dcDate: today,
    soReference: '',
    warehouse: SAMPLE_WAREHOUSES[0],
    vehicleNo: '',
    transporter: '',
    salesMan: SAMPLE_SALESMEN[0],
    sellerGstin: '24AABCU9603R1ZM',
    customerGstin: '',
    placeOfSupply: '24-Gujarat',
    narration: '',
  };
}

export const SAMPLE_LIST_ROWS: DeliveryChallanListRow[] = [
  { id: '1', billNo: 'DC-842', date: '04-06-2026', customer: 'Gujarat Textiles Ltd', soReference: 'PO-1205', amount: '38,520.00', status: 'Open' },
  { id: '2', billNo: 'DC-841', date: '03-06-2026', customer: 'Metro Yarn Customers', soReference: 'PO-1204', amount: '9,340.00', status: 'Posted' },
  { id: '3', billNo: 'DC-840', date: '02-06-2026', customer: 'Walk-in Customer', soReference: '', amount: '1,180.00', status: 'Draft' },
];
