import {
  columnsForTransaction,
  DEFAULT_PRINT_SETTINGS,
  DEFAULT_VISIBILITY,
  LAYOUT_VERSION as CATALOG_LAYOUT_VERSION
} from './billFormatCatalog.js';
import {
  DEFAULT_SALES_BILL_TEMPLATES as LEGACY_SALES,
  normalizeLayoutJson as legacyNormalize
} from './salesBillTemplateDefaults.js';

export const LAYOUT_VERSION = CATALOG_LAYOUT_VERSION;

export function normalizeLayoutJson(layout) {
  const normalized = legacyNormalize(layout);
  if (!normalized.visibility) normalized.visibility = { ...DEFAULT_VISIBILITY };
  if (!normalized.printSettings) normalized.printSettings = { ...DEFAULT_PRINT_SETTINGS };
  if (!normalized.documentTitle && normalized.sections?.length) {
    const header = normalized.sections.find((s) => s.id === 'header');
    if (header?.text) normalized.documentTitle = header.text.replace(/\{\{documentTitle\}\}/gi, '').trim();
  }
  normalized.version = Number(normalized.version) || LAYOUT_VERSION;
  return normalized;
}

function buildPurchaseLayout(transactionType, title, pageOverrides = {}) {
  const columns = columnsForTransaction(transactionType);
  const base = LEGACY_SALES[0].layoutJson;
  return normalizeLayoutJson({
    ...JSON.parse(JSON.stringify(base)),
    version: LAYOUT_VERSION,
    documentTitle: title,
    page: { ...base.page, ...pageOverrides },
    sections: base.sections.map((s) => {
      if (s.id === 'header') return { ...s, text: title };
      if (s.id === 'customerDetails' && transactionType.startsWith('purchase')) {
        return { ...s, type: 'supplierDetails', label: 'Supplier Details' };
      }
      return s;
    }),
    itemTable: {
      ...base.itemTable,
      columns
    }
  });
}

/** @type {typeof LEGACY_SALES} */
export const DEFAULT_SALES_BILL_TEMPLATES = LEGACY_SALES.map((t) => ({
  ...t,
  formatCode: String(t.templateKey).toUpperCase(),
  transactionType: t.appliesToDocTypes?.[0] ?? 'sales_invoice',
  printSettings: { ...DEFAULT_PRINT_SETTINGS },
  visibilityRules: { ...DEFAULT_VISIBILITY }
}));

export const DEFAULT_PURCHASE_BILL_TEMPLATES = [
  {
    templateKey: 'pi_standard',
    formatCode: 'PI-STD',
    name: 'Standard Purchase Invoice',
    description: 'Default purchase invoice format.',
    transactionType: 'purchase_invoice',
    isSystem: true,
    isDefault: true,
    appliesToDocTypes: ['purchase_invoice'],
    printSettings: { ...DEFAULT_PRINT_SETTINGS },
    visibilityRules: { ...DEFAULT_VISIBILITY, showCustomerInfo: false },
    layoutJson: buildPurchaseLayout('purchase_invoice', 'PURCHASE INVOICE')
  },
  {
    templateKey: 'po_standard',
    formatCode: 'PO-STD',
    name: 'Standard Purchase Order',
    description: 'Default purchase order format.',
    transactionType: 'purchase_order',
    isSystem: true,
    isDefault: true,
    appliesToDocTypes: ['purchase_order'],
    printSettings: { ...DEFAULT_PRINT_SETTINGS },
    visibilityRules: { ...DEFAULT_VISIBILITY, showCustomerInfo: false },
    layoutJson: buildPurchaseLayout('purchase_order', 'PURCHASE ORDER')
  },
  {
    templateKey: 'pr_standard',
    formatCode: 'PR-STD',
    name: 'Purchase Return Format',
    description: 'Default purchase return format.',
    transactionType: 'purchase_return',
    isSystem: true,
    isDefault: true,
    appliesToDocTypes: ['purchase_return'],
    printSettings: { ...DEFAULT_PRINT_SETTINGS },
    visibilityRules: { ...DEFAULT_VISIBILITY, showCustomerInfo: false },
    layoutJson: buildPurchaseLayout('purchase_return', 'PURCHASE RETURN')
  },
  {
    templateKey: 'grn_standard',
    formatCode: 'GRN-STD',
    name: 'GRN Format',
    description: 'Goods receipt note with received/accepted/rejected qty columns.',
    transactionType: 'grn',
    isSystem: true,
    isDefault: true,
    appliesToDocTypes: ['grn'],
    printSettings: { ...DEFAULT_PRINT_SETTINGS },
    visibilityRules: {
      ...DEFAULT_VISIBILITY,
      showCustomerInfo: false,
      showTaxBreakup: false,
      showDiscount: false
    },
    layoutJson: buildPurchaseLayout('grn', 'GOODS RECEIPT NOTE')
  }
];
