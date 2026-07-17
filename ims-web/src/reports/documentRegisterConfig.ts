import type { DocumentRegisterType } from '../api/reports';

export interface DocumentRegisterScreenConfig {
  registerType: DocumentRegisterType;
  title: string;
  partyLabel: string;
}

export const DOCUMENT_REGISTER_CONFIG: Record<string, DocumentRegisterScreenConfig> = {
  'sales-order-register': {
    registerType: 'sales_order',
    title: 'Sales Orders Report',
    partyLabel: 'Customer',
  },
  'sales-dc-register': {
    registerType: 'delivery_challan',
    title: 'Delivery Notes Report',
    partyLabel: 'Customer',
  },
  'sales-invoice-register': {
    registerType: 'sales_invoice',
    title: 'Invoices Report',
    partyLabel: 'Customer',
  },
  'sales-return-register': {
    registerType: 'sales_return',
    title: 'Returns Report',
    partyLabel: 'Customer',
  },
  'purchase-order-register': {
    registerType: 'purchase_order',
    title: 'Purchase Orders Report',
    partyLabel: 'Supplier',
  },
  'grn-register': {
    registerType: 'grn',
    title: 'Goods Receipt Report',
    partyLabel: 'Supplier',
  },
  'purchase-invoice-register': {
    registerType: 'purchase_invoice',
    title: 'Vendor Bills Report',
    partyLabel: 'Supplier',
  },
  'purchase-return-register': {
    registerType: 'purchase_return',
    title: 'Vendor Returns Report',
    partyLabel: 'Supplier',
  },
};
