/** Shared list query params aligned with GET /api/* list routes. */
export interface TransactionListQueryBase {
  search?: string;
  status?: string;
  page?: number;
  limit?: number;
  sort?: string;
  sortDir?: 'asc' | 'desc';
  col1?: string;
  col2?: string;
  col3?: string;
  col4?: string;
  col5?: string;
}

export const LIST_PAGE_SIZES = [10, 25, 50, 100, 500] as const;

/** Matches CorporateDataGrid column widths for standard sales list (actions + 5 cols). */
export const SALES_LIST_GRID_TEMPLATE = '88px 120px 100px minmax(180px, 1fr) 110px 90px';
export const DEFAULT_LIST_PAGE_SIZE = 25;
export const LIST_SEARCH_DEBOUNCE_MS = 350;

export type SortDirection = 'asc' | 'desc';

export interface TransactionListColumnFilters {
  billNo: string;
  customer: string;
  amount: string;
  date: string;
  status: string;
}

/** Purchase lists use `customer` filter key → API col2 maps to supplier. */
export const PURCHASE_LIST_COLUMN_FILTER_DEFS: {
  key: keyof TransactionListColumnFilters;
  placeholder: string;
}[] = [
  { key: 'billNo', placeholder: 'Filter doc no…' },
  { key: 'date', placeholder: 'Filter date…' },
  { key: 'customer', placeholder: 'Filter supplier…' },
  { key: 'amount', placeholder: 'Filter amount…' },
  { key: 'status', placeholder: 'Filter status…' },
];

export const GRN_LIST_GRID_TEMPLATE = '88px 110px 100px minmax(160px, 1fr) 100px 100px 90px';

/** Order matches list grid columns: billNo, date, customer, amount, status. */
export const SALES_LIST_COLUMN_FILTER_DEFS: {
  key: keyof TransactionListColumnFilters;
  placeholder: string;
}[] = [
  { key: 'billNo', placeholder: 'Filter doc no…' },
  { key: 'date', placeholder: 'Filter date…' },
  { key: 'customer', placeholder: 'Filter customer…' },
  { key: 'amount', placeholder: 'Filter amount…' },
  { key: 'status', placeholder: 'Filter status…' },
];

export const EMPTY_COLUMN_FILTERS: TransactionListColumnFilters = {
  billNo: '',
  customer: '',
  amount: '',
  date: '',
  status: '',
};

export function appendTransactionListQueryParams(
  params: URLSearchParams,
  query: TransactionListQueryBase,
): void {
  if (query.search) params.set('search', query.search);
  if (query.status && query.status !== 'All' && query.status !== '(All)') {
    params.set('status', query.status.toLowerCase().replace(/\s+/g, '_'));
  }
  if (query.page != null) params.set('page', String(query.page));
  if (query.limit != null) params.set('limit', String(query.limit));
  if (query.sort) params.set('sort', query.sort);
  if (query.sortDir) params.set('sortDir', query.sortDir);
  if (query.col1) params.set('col1', query.col1);
  if (query.col2) params.set('col2', query.col2);
  if (query.col3) params.set('col3', query.col3);
  if (query.col4) params.set('col4', query.col4);
  if (query.col5) params.set('col5', query.col5);
}

export function columnFiltersToQuery(
  filters: TransactionListColumnFilters,
): Pick<TransactionListQueryBase, 'col1' | 'col2' | 'col3' | 'col4' | 'col5'> {
  const next: Pick<TransactionListQueryBase, 'col1' | 'col2' | 'col3' | 'col4' | 'col5'> = {};
  if (filters.billNo.trim()) next.col1 = filters.billNo.trim();
  if (filters.customer.trim()) next.col2 = filters.customer.trim();
  if (filters.amount.trim()) next.col3 = filters.amount.trim();
  if (filters.status.trim()) next.col4 = filters.status.trim();
  if (filters.date.trim()) next.col5 = filters.date.trim();
  return next;
}

/** WPF SalesOrdersViewModel sort keys → API. */
export function salesOrderSortField(columnId: string): string {
  const map: Record<string, string> = {
    billNo: 'docNo',
    date: 'soDate',
    customer: 'customer',
    amount: 'salesAmt',
    status: 'status',
  };
  return map[columnId] ?? 'docNo';
}

/** WPF quotation list sort keys → API. */
export function purchaseOrderSortField(columnId: string): string {
  const map: Record<string, string> = {
    billNo: 'docNo',
    date: 'poDate',
    supplier: 'supplier',
    amount: 'orderAmount',
    status: 'status',
  };
  return map[columnId] ?? 'docNo';
}

export function purchaseInvoiceSortField(columnId: string): string {
  const map: Record<string, string> = {
    billNo: 'docNo',
    date: 'invoiceDate',
    supplier: 'supplier',
    amount: 'orderAmount',
    status: 'status',
  };
  return map[columnId] ?? 'docNo';
}

export function purchaseReturnSortField(columnId: string): string {
  const map: Record<string, string> = {
    billNo: 'docNo',
    date: 'returnDate',
    supplier: 'supplier',
    amount: 'orderAmount',
    status: 'status',
  };
  return map[columnId] ?? 'docNo';
}

export function grnSortField(columnId: string): string {
  const map: Record<string, string> = {
    billNo: 'docNo',
    date: 'grnDate',
    supplier: 'supplier',
    amount: 'orderAmount',
    status: 'status',
  };
  return map[columnId] ?? 'docNo';
}

export function quotationSortField(columnId: string): string {
  const map: Record<string, string> = {
    billNo: 'docNo',
    date: 'quoteDate',
    customer: 'customer',
    amount: 'salesAmt',
    status: 'status',
  };
  return map[columnId] ?? 'docNo';
}

/** Numbered sales document list (SI / DC / SR) — WPF col* → API sort. */
export function numberedSalesSortField(
  columnId: string,
  dateField: 'invoiceDate' | 'dcDate' | 'returnDate',
): string {
  const map: Record<string, string> = {
    billNo: 'docNo',
    date: dateField,
    customer: 'customer',
    status: 'status',
  };
  return map[columnId] ?? dateField;
}

export function toggleSort(
  currentField: string,
  currentDir: SortDirection,
  columnId: string,
): { sortColumn: string; sortDir: SortDirection } {
  if (currentField === columnId) {
    return { sortColumn: columnId, sortDir: currentDir === 'asc' ? 'desc' : 'asc' };
  }
  return { sortColumn: columnId, sortDir: 'asc' };
}

export function totalListPages(total: number, pageSize: number): number {
  return Math.max(1, Math.ceil(total / pageSize) || 1);
}
