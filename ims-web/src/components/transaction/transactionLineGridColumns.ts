/** Line-item grid column catalog (mirrors api/src/catalog/salesLineGridColumns.js). */
export const API_TRANSACTION_LINE_GRID_MODULES = [
  'sales_order',
  'sales_invoice',
  'delivery_challan',
  'sales_return',
  'purchase_order',
  'grn',
  'purchase_invoice',
  'purchase_return',
] as const;

export type ApiTransactionLineGridModuleKey = (typeof API_TRANSACTION_LINE_GRID_MODULES)[number];

/** Web-only module — not supported by /api/grid-columns; uses localStorage. */
export const QUOTATION_LINE_GRID_MODULE = 'quotation' as const;

export type TransactionLineGridModuleKey =
  | ApiTransactionLineGridModuleKey
  | typeof QUOTATION_LINE_GRID_MODULE;

export interface TransactionLineGridColumnDef {
  key: string;
  header: string;
  mandatory: boolean;
  defaultVisible: boolean;
}

export const TRANSACTION_LINE_GRID_COLUMNS: TransactionLineGridColumnDef[] = [
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
  { key: 'lineTotal', header: 'Line Total', mandatory: false, defaultVisible: true },
];

const PURCHASE_MODULE_KEYS = new Set([
  'purchase_order',
  'grn',
  'purchase_invoice',
  'purchase_return',
]);

const PURCHASE_BAL_STK_COLUMN: TransactionLineGridColumnDef = {
  key: 'balStk',
  header: 'Bal Stk',
  mandatory: false,
  defaultVisible: true,
};

const PURCHASE_INVOICE_SALES_RATE_COLUMN: TransactionLineGridColumnDef = {
  key: 'salesRate',
  header: 'Sale Rate',
  mandatory: false,
  defaultVisible: true,
};

function getColumnsForModule(moduleKey?: string): TransactionLineGridColumnDef[] {
  const key = moduleKey ?? '';
  if (!PURCHASE_MODULE_KEYS.has(key)) {
    return TRANSACTION_LINE_GRID_COLUMNS;
  }

  const columns: TransactionLineGridColumnDef[] = [];
  for (const col of TRANSACTION_LINE_GRID_COLUMNS) {
    if (col.key === 'qty') {
      columns.push(PURCHASE_BAL_STK_COLUMN);
    }
    columns.push(col);
    if (key === 'purchase_invoice' && col.key === 'rate') {
      columns.push(PURCHASE_INVOICE_SALES_RATE_COLUMN);
    }
  }
  return columns;
}
const INTRA_STATE_ONLY = new Set(['cgstPercent', 'cgstAmount', 'sgstPercent', 'sgstAmount']);
const INTER_STATE_ONLY = new Set(['igstPercent', 'igstAmount']);

export function getLineGridModuleTitle(moduleKey: TransactionLineGridModuleKey): string {
  switch (moduleKey) {
    case 'sales_order':
      return 'Sales Order';
    case 'sales_invoice':
      return 'Sales Invoice';
    case 'delivery_challan':
      return 'Delivery Challan';
    case 'sales_return':
      return 'Sales Return';
    case 'quotation':
      return 'Quotation';
    case 'purchase_order':
      return 'Purchase Order';
    case 'grn':
      return 'GRN';
    case 'purchase_invoice':
      return 'Purchase Invoice';
    case 'purchase_return':
      return 'Purchase Return';
    default:
      return moduleKey;
  }
}

/** React CorporateDataGrid column id → API catalog key. */
export const LINE_GRID_ID_TO_CATALOG_KEY: Record<string, string | undefined> = {
  delete: 'actions',
  sr: 'sr',
  code: 'code',
  desc: 'itemDescription',
  balStk: 'balStk',
  qty: 'qty',
  rate: 'rate',
  salesRate: 'salesRate',
  disc: 'discPercent',
  taxable: 'taxableValue',
  cgstPct: 'cgstPercent',
  cgstAmt: 'cgstAmount',
  sgstPct: 'sgstPercent',
  sgstAmt: 'sgstAmount',
  igstPct: 'igstPercent',
  igstAmt: 'igstAmount',
  total: 'lineTotal',
};

export function isApiLineGridModule(
  moduleKey: string,
): moduleKey is ApiTransactionLineGridModuleKey {
  return (API_TRANSACTION_LINE_GRID_MODULES as readonly string[]).includes(moduleKey);
}

export function getDefaultVisibleLineGridKeys(moduleKey?: string): string[] {
  return getColumnsForModule(moduleKey).filter((c) => c.defaultVisible).map((c) => c.key);
}

export function getMandatoryLineGridKeys(moduleKey?: string): string[] {
  return getColumnsForModule(moduleKey).filter((c) => c.mandatory).map((c) => c.key);
}

export function normalizeVisibleLineGridKeys(
  keys: Iterable<string> | null | undefined,
  moduleKey?: string,
): string[] {
  const mandatory = new Set(getMandatoryLineGridKeys(moduleKey));
  const selected = new Set(keys ?? []);
  return getColumnsForModule(moduleKey).filter(
    (col) => mandatory.has(col.key) || selected.has(col.key),
  ).map((col) => col.key);
}

export function isCatalogColumnVisible(
  catalogKey: string,
  visibleKeys: readonly string[],
  isInterState: boolean,
): boolean {
  if (!visibleKeys.includes(catalogKey)) return false;
  if (INTRA_STATE_ONLY.has(catalogKey)) return !isInterState;
  if (INTER_STATE_ONLY.has(catalogKey)) return isInterState;
  return true;
}

export function isLineGridColumnVisible(
  columnId: string,
  visibleKeys: readonly string[],
  isInterState: boolean,
  moduleKey: TransactionLineGridModuleKey,
): boolean {
  if (columnId === 'salesRate' && moduleKey !== 'purchase_invoice') {
    return false;
  }

  if (columnId === 'balStk' && !PURCHASE_MODULE_KEYS.has(moduleKey)) {
    return false;
  }

  const catalogKey = LINE_GRID_ID_TO_CATALOG_KEY[columnId];
  if (!catalogKey) {
    return true;
  }

  return isCatalogColumnVisible(catalogKey, visibleKeys, isInterState);
}

export function filterLineGridColumns<T extends { id: string }>(
  columns: T[],
  visibleKeys: readonly string[],
  isInterState: boolean,
  moduleKey: TransactionLineGridModuleKey,
): T[] {
  return columns.filter((col) =>
    isLineGridColumnVisible(col.id, visibleKeys, isInterState, moduleKey),
  );
}

export function filterEditableLineGridColumnIds(
  editableIds: readonly string[],
  visibleColumns: readonly { id: string }[],
): string[] {
  const visible = new Set(visibleColumns.map((c) => c.id));
  return editableIds.filter((id) => visible.has(id));
}

const LOCAL_STORAGE_PREFIX = 'ims.transactionLineGridColumns.';

export function loadLocalLineGridColumnKeys(moduleKey: TransactionLineGridModuleKey): string[] | null {
  try {
    const raw = localStorage.getItem(`${LOCAL_STORAGE_PREFIX}${moduleKey}`);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return null;
    return normalizeVisibleLineGridKeys(parsed.filter((k) => typeof k === 'string'), moduleKey);
  } catch {
    return null;
  }
}

export function saveLocalLineGridColumnKeys(
  moduleKey: TransactionLineGridModuleKey,
  keys: readonly string[],
): void {
  try {
    localStorage.setItem(
      `${LOCAL_STORAGE_PREFIX}${moduleKey}`,
      JSON.stringify(normalizeVisibleLineGridKeys(keys, moduleKey)),
    );
  } catch {
    // ignore quota errors
  }
}

export function clearLocalLineGridColumnKeys(moduleKey: TransactionLineGridModuleKey): void {
  try {
    localStorage.removeItem(`${LOCAL_STORAGE_PREFIX}${moduleKey}`);
  } catch {
    // ignore
  }
}
