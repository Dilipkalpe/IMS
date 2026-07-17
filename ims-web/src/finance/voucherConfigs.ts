import type { VoucherApiPath } from '../api/financeVouchers';

export interface VoucherModuleConfig {
  apiPath: VoucherApiPath;
  title: string;
  listNavKey: string;
  entryNavKey: string;
  allocationNavKey?: string;
  voucherType: string;
  accountType: 'customer' | 'supplier';
  accountLabel: string;
  newButtonLabel: string;
}

export const PAYMENT_VOUCHER_CONFIG: VoucherModuleConfig = {
  apiPath: 'payment-vouchers',
  title: 'Payments',
  listNavKey: 'payment-voucher',
  entryNavKey: 'payment-voucher-entry',
  allocationNavKey: 'payment-voucher-allocation',
  voucherType: 'payment',
  accountType: 'supplier',
  accountLabel: 'Supplier account',
  newButtonLabel: 'New payment',
};

export const RECEIPT_VOUCHER_CONFIG: VoucherModuleConfig = {
  apiPath: 'receipt-vouchers',
  title: 'Collections',
  listNavKey: 'receipt-voucher',
  entryNavKey: 'receipt-voucher-entry',
  voucherType: 'receipt',
  accountType: 'customer',
  accountLabel: 'Customer account',
  newButtonLabel: 'New receipt',
};

export const CREDIT_NOTE_CONFIG: VoucherModuleConfig = {
  apiPath: 'credit-notes',
  title: 'Credit Notes',
  listNavKey: 'credit-note',
  entryNavKey: 'credit-note-entry',
  voucherType: 'credit_note',
  accountType: 'customer',
  accountLabel: 'Customer account',
  newButtonLabel: 'New credit note',
};

export const DEBIT_NOTE_CONFIG: VoucherModuleConfig = {
  apiPath: 'debit-notes',
  title: 'Debit Notes',
  listNavKey: 'debit-note',
  entryNavKey: 'debit-note-entry',
  voucherType: 'debit_note',
  accountType: 'supplier',
  accountLabel: 'Supplier account',
  newButtonLabel: 'New debit note',
};

export const BANK_ENTRY_CONFIG: VoucherModuleConfig = {
  apiPath: 'bank-entries',
  title: 'Banking',
  listNavKey: 'bank-entry',
  entryNavKey: 'bank-entry-entry',
  voucherType: 'bank_entry',
  accountType: 'supplier',
  accountLabel: 'Account',
  newButtonLabel: 'New bank entry',
};
