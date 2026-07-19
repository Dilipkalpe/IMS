import { createAccount, type AccountRecord } from '../../api/accounts';
import { createProduct, type ProductMasterRecord } from '../../api/products';
import { createMasterRecord } from '../../api/masters';
import type { QuickAddConfig, SearchableOption } from './searchableSelectTypes';

function suggestCodeFromName(name: string, prefix: string): string {
  const base =
    name
      .trim()
      .replace(/[^a-zA-Z0-9]/g, '')
      .slice(0, 6)
      .toUpperCase() || prefix;
  const suffix = Date.now().toString(36).slice(-4).toUpperCase();
  return `${base}${suffix}`;
}

function accountQuickAddConfig(accountType: 'customer' | 'supplier'): QuickAddConfig {
  const entityLabel = accountType === 'customer' ? 'Customer' : 'Supplier';
  return {
    entityLabel,
    fields: [
      {
        key: 'name',
        label: 'Name',
        required: true,
        prefillFromSearch: true,
      },
      {
        key: 'code',
        label: 'Account code',
        placeholder: 'Auto-generated if blank',
      },
      {
        key: 'mobileNo',
        label: 'Mobile',
        placeholder: 'Optional',
      },
      {
        key: 'city',
        label: 'City',
        placeholder: 'Optional',
      },
    ],
    create: async (values): Promise<SearchableOption> => {
      const name = values.name?.trim() ?? '';
      const code = (values.code?.trim() || suggestCodeFromName(name, accountType === 'customer' ? 'CUS' : 'SUP')).toUpperCase();
      const payload: AccountRecord = {
        code,
        name,
        accountType,
        activeStatus: true,
        gstExempt: false,
        creditLimit: 0,
        creditDays: 0,
        openingBalance: 0,
        openingBalanceType: 'debit',
        mobileNo: values.mobileNo?.trim() || undefined,
        city: values.city?.trim() || undefined,
        billFormatAssignments: {},
      };
      const created = await createAccount(payload);
      return { value: created.name, label: created.name, searchText: `${created.code} ${created.name}` };
    },
  };
}

export const customerQuickAddConfig = accountQuickAddConfig('customer');
export const supplierQuickAddConfig = accountQuickAddConfig('supplier');

export const productQuickAddConfig: QuickAddConfig = {
  entityLabel: 'Product',
  fields: [
    {
      key: 'name',
      label: 'Product name',
      required: true,
      prefillFromSearch: true,
    },
    {
      key: 'code',
      label: 'Product code',
      placeholder: 'Auto-generated if blank',
    },
    {
      key: 'salePrice',
      label: 'Sale price',
      type: 'number',
      placeholder: '0',
    },
  ],
  create: async (values): Promise<SearchableOption> => {
    const name = values.name?.trim() ?? '';
    const code = (values.code?.trim() || suggestCodeFromName(name, 'PRD')).toUpperCase();
    const payload: ProductMasterRecord = {
      code,
      name,
      category: 'General',
      unit: 'EA',
      salePrice: Number(values.salePrice) || 0,
      purchasePrice: 0,
      reorderQty: 0,
      minOrderQty: 0,
      cgst: 9,
      sgst: 9,
      igst: 0,
      taxType: 'GST',
      taxPercent: '18',
      stockQty: 0,
      activeStatus: true,
      gstExempt: false,
      serialApplicable: false,
    };
    const created = await createProduct(payload);
    return {
      value: created.code,
      label: `${created.code} — ${created.name}`,
      searchText: `${created.code} ${created.name}`,
    };
  },
};

export function machineQuickAddConfig(): QuickAddConfig {
  return {
    entityLabel: 'Machine',
    fields: [
      { key: 'name', label: 'Machine name', required: true, prefillFromSearch: true },
      { key: 'code', label: 'Machine code', placeholder: 'Auto-generated if blank' },
    ],
    create: async (values): Promise<SearchableOption> => {
      const name = values.name?.trim() ?? '';
      const code = (values.code?.trim() || suggestCodeFromName(name, 'MCH')).toUpperCase();
      const created = await createMasterRecord('machines', { code, name, activeStatus: true });
      const label = String(created.name ?? name);
      return { value: code, label: `${code} — ${label}`, searchText: `${code} ${label}` };
    },
  };
}

/** Account picker keyed by account code (payment allocation, vouchers). */
function accountCodeQuickAddConfig(accountType: 'customer' | 'supplier'): QuickAddConfig {
  const entityLabel = accountType === 'customer' ? 'Customer' : 'Supplier';
  const prefix = accountType === 'customer' ? 'CUS' : 'SUP';
  const base = accountQuickAddConfig(accountType);
  return {
    ...base,
    entityLabel,
    create: async (values): Promise<SearchableOption> => {
      const name = values.name?.trim() ?? '';
      const code = (values.code?.trim() || suggestCodeFromName(name, prefix)).toUpperCase();
      const payload: AccountRecord = {
        code,
        name,
        accountType,
        activeStatus: true,
        gstExempt: false,
        creditLimit: 0,
        creditDays: 0,
        openingBalance: 0,
        openingBalanceType: 'debit',
        mobileNo: values.mobileNo?.trim() || undefined,
        city: values.city?.trim() || undefined,
        billFormatAssignments: {},
      };
      const created = await createAccount(payload);
      return {
        value: created.code,
        label: `${created.code} — ${created.name}`,
        searchText: `${created.code} ${created.name}`,
      };
    },
  };
}

export const customerAccountQuickAddConfig = accountCodeQuickAddConfig('customer');
export const supplierAccountQuickAddConfig = accountCodeQuickAddConfig('supplier');
