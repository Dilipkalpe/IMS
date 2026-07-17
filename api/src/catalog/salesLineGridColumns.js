/** Line-item grid columns for sales and purchase entry screens. */
export const TRANSACTION_LINE_GRID_MODULES = [
  'sales_order',
  'sales_invoice',
  'delivery_challan',
  'sales_return',
  'purchase_order',
  'grn',
  'purchase_invoice',
  'purchase_return'
];

/** @deprecated Use TRANSACTION_LINE_GRID_MODULES */
export const SALES_LINE_GRID_MODULES = TRANSACTION_LINE_GRID_MODULES;

const PURCHASE_INVOICE_EXTRA_COLUMNS = [
  { key: 'salesRate', header: 'Sales Rate', mandatory: false, defaultVisible: true }
];

const PURCHASE_BAL_STK_COLUMN = {
  key: 'balStk',
  header: 'Bal Stk',
  mandatory: false,
  defaultVisible: true
};

const PURCHASE_MODULE_KEYS = new Set([
  'purchase_order',
  'grn',
  'purchase_invoice',
  'purchase_return'
]);

export const TRANSACTION_LINE_GRID_COLUMNS = [
  { key: 'actions', header: 'Actions', mandatory: true, defaultVisible: true },
  { key: 'sr', header: 'Sr', mandatory: true, defaultVisible: true },
  { key: 'code', header: 'Code', mandatory: true, defaultVisible: true },
  { key: 'itemDescription', header: 'Item Description', mandatory: true, defaultVisible: true },
  { key: 'qty', header: 'Qty', mandatory: true, defaultVisible: true },
  { key: 'rate', header: 'Rate', mandatory: false, defaultVisible: true },
  { key: 'discPercent', header: 'Line Disc %', mandatory: false, defaultVisible: true },
  { key: 'taxableValue', header: 'Taxable Value', mandatory: false, defaultVisible: true },
  { key: 'cgstPercent', header: 'CGST %', mandatory: false, defaultVisible: true },
  { key: 'cgstAmount', header: 'CGST Amt', mandatory: false, defaultVisible: true },
  { key: 'sgstPercent', header: 'SGST %', mandatory: false, defaultVisible: true },
  { key: 'sgstAmount', header: 'SGST Amt', mandatory: false, defaultVisible: true },
  { key: 'igstPercent', header: 'IGST %', mandatory: false, defaultVisible: true },
  { key: 'igstAmount', header: 'IGST Amt', mandatory: false, defaultVisible: true },
  { key: 'lineTotal', header: 'Line Total', mandatory: false, defaultVisible: true }
];

/** @deprecated Use TRANSACTION_LINE_GRID_COLUMNS */
export const SALES_LINE_GRID_COLUMNS = TRANSACTION_LINE_GRID_COLUMNS;

export function isTransactionLineGridModule(moduleKey) {
  return TRANSACTION_LINE_GRID_MODULES.includes(String(moduleKey ?? '').trim());
}

export function isSalesLineGridModule(moduleKey) {
  return isTransactionLineGridModule(moduleKey);
}

export function getColumnsForModule(moduleKey) {
  const key = String(moduleKey ?? '').trim();
  if (!PURCHASE_MODULE_KEYS.has(key)) {
    return TRANSACTION_LINE_GRID_COLUMNS;
  }

  const columns = [];
  for (const col of TRANSACTION_LINE_GRID_COLUMNS) {
    if (col.key === 'qty') {
      columns.push(PURCHASE_BAL_STK_COLUMN);
    }
    columns.push(col);
    if (key === 'purchase_invoice' && col.key === 'rate') {
      columns.push(...PURCHASE_INVOICE_EXTRA_COLUMNS);
    }
  }
  return columns;
}

export function getDefaultVisibleColumnKeys(moduleKey) {
  return getColumnsForModule(moduleKey).filter((c) => c.defaultVisible).map((c) => c.key);
}

export function getMandatoryColumnKeys(moduleKey) {
  return getColumnsForModule(moduleKey).filter((c) => c.mandatory).map((c) => c.key);
}

export function normalizeVisibleColumnKeys(keys, moduleKey) {
  const columns = getColumnsForModule(moduleKey);
  const mandatory = new Set(getMandatoryColumnKeys(moduleKey));
  const ordered = [];
  for (const col of columns) {
    if (mandatory.has(col.key) || (Array.isArray(keys) && keys.includes(col.key))) {
      ordered.push(col.key);
    }
  }
  return ordered;
}

export function getCatalogForModule(moduleKey) {
  if (!isTransactionLineGridModule(moduleKey)) {
    throw new Error(`Unknown grid module: ${moduleKey}`);
  }
  const columns = getColumnsForModule(moduleKey);
  return {
    moduleKey,
    columns,
    defaultVisibleColumnKeys: getDefaultVisibleColumnKeys(moduleKey),
    mandatoryColumnKeys: getMandatoryColumnKeys(moduleKey)
  };
}
