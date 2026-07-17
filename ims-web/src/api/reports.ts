import { apiFetch } from './client';

export type DocumentRegisterType =
  | 'sales_order'
  | 'delivery_challan'
  | 'sales_invoice'
  | 'sales_return'
  | 'purchase_order'
  | 'grn'
  | 'purchase_invoice'
  | 'purchase_return';

export interface DocumentRegisterRow {
  serialNo: number;
  billNo: string;
  billDate: string;
  party: string;
  amount: number;
  amountDisplay: string;
  status: string;
  narration: string;
}

export interface DocumentRegisterReport {
  registerType: string;
  title: string;
  partyLabel: string;
  dateFromLabel: string;
  dateToLabel: string;
  billNoFilter: string;
  documentCount: number;
  totalAmount: number;
  totalAmountDisplay: string;
  rows: DocumentRegisterRow[];
}

export interface SalesAnalysisRow {
  serialNo: number;
  productId: string;
  productName: string;
  mainGroup: string;
  customer: string;
  qty: number;
  revenue: number;
  discount: number;
  cogs: number;
  grossProfit: number;
  marginPct: number;
  invoiceCount: number;
}

export interface SalesAnalysisTotals {
  qty: number;
  revenue: number;
  discount: number;
  cogs: number;
  grossProfit: number;
  marginPct: number;
  invoiceCount: number;
}

export interface SalesAnalysisReport {
  dateFromLabel: string;
  dateToLabel: string;
  rows: SalesAnalysisRow[];
  totals: SalesAnalysisTotals;
  count: number;
}

export interface PurchaseAnalysisReport {
  dateFromLabel: string;
  dateToLabel: string;
  rows: Array<{
    serialNo: number;
    productId: string;
    productName: string;
    mainGroup: string;
    supplier: string;
    qty: number;
    amount: number;
    discount: number;
    invoiceCount: number;
  }>;
  totals: { qty: number; amount: number; discount: number; invoiceCount: number };
  count: number;
}

export interface ProfitAnalysisReport {
  dateFromLabel: string;
  dateToLabel: string;
  rows: Array<{
    serialNo: number;
    productId: string;
    productName: string;
    mainGroup: string;
    qty: number;
    saleRate: number;
    revenue: number;
    discount: number;
    cogs: number;
    grossProfit: number;
    marginPct: number;
  }>;
  totals: {
    qty: number;
    revenue: number;
    discount: number;
    cogs: number;
    grossProfit: number;
    marginPct: number;
  };
  count: number;
}

export interface LedgerAccountOption {
  code: string;
  name: string;
  kind?: string;
}

export interface LedgerReport {
  accountCode: string;
  accountName: string;
  dateFromLabel: string;
  dateToLabel: string;
  openingBalance: number;
  openingBalanceSide: string;
  periodDebit: number;
  periodCredit: number;
  footerDebit: number;
  footerCredit: number;
  closingBalance: number;
  closingBalanceSide: string;
  transactionCount: number;
  rows: Array<{
    serialNo: number;
    date: string;
    entryNo: string;
    particular: string;
    dr: number;
    cr: number;
    drDisplay: string;
    crDisplay: string;
  }>;
}

export interface TrialBalanceReport {
  dateFromLabel: string;
  dateToLabel: string;
  rows: Array<{
    serialNo: number;
    accountCode: string;
    accountName: string;
    debit: number;
    credit: number;
    debitDisplay: string;
    creditDisplay: string;
  }>;
  totalDr: number;
  totalCr: number;
  totalDrDisplay: string;
  totalCrDisplay: string;
  accountCount: number;
  isBalanced: boolean;
}

export interface FinancialStatementReport {
  title: string;
  dateFromLabel: string;
  dateToLabel: string;
  rows: Array<{
    serialNo: number;
    section: string;
    particular: string;
    debit: number;
    credit: number;
    debitDisplay: string;
    creditDisplay: string;
  }>;
  debitTotal: number;
  creditTotal: number;
  netAmount: number;
  netAmountLabel: string;
  grossProfit?: number;
  count: number;
}

export interface OpeningStockReport {
  dateLabel: string;
  rows: Array<{
    serialNo: number;
    itemId: string;
    itemName: string;
    unit: string;
    date: string;
    qty: number;
    rate: number;
    valuation: number;
  }>;
  totalQty: number;
  totalValuation: number;
  count: number;
}

export interface ClosingStockReport {
  dateFromLabel: string;
  dateToLabel: string;
  rows: Array<Record<string, unknown>>;
  count: number;
  totalQty?: number;
  totalValuation?: number;
}

export interface StockDetailsSummaryReport {
  rows: Array<{
    serialNo: number;
    productCode: string;
    productName: string;
    mainGroup: string;
    productType: string;
    unit: string;
    onHandQty: number;
    purchaseRate: number;
    stockValue: number;
    reorderLevel: number;
    shortageQty: number;
    status: string;
  }>;
  count: number;
  belowReorderCount: number;
  totalOnHand: number;
  totalStockValue: number;
  totalShortageQty: number;
}

export interface ReorderLevelReport {
  rows: Array<{
    serialNo: number;
    productId: string;
    productName: string;
    unit: string;
    onHand: number;
    reorderLevel: number;
    shortage: number;
    status: string;
  }>;
  count: number;
  belowCount: number;
  totalOnHand: number;
  totalReorder: number;
  totalShortage: number;
}

export interface StockMovementReport {
  dateFromLabel: string;
  dateToLabel: string;
  rows: Array<Record<string, unknown>>;
  count: number;
}

export interface OutstandingReport {
  asOnDateLabel: string;
  count: number;
  rows: Array<Record<string, unknown>>;
  totals: { totalReceivable: number; totalPayable: number; totalBalance: number };
}

export interface DueDayReport {
  asOnDateLabel: string;
  count: number;
  rows: Array<Record<string, unknown>>;
  totals: Record<string, number>;
}

export interface DueAmountReport {
  asOnDateLabel: string;
  count: number;
  rows: Array<Record<string, unknown>>;
  totals: Record<string, number>;
}

function buildQuery(params: Record<string, string | boolean | undefined>): string {
  const qs = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === '') continue;
    if (typeof value === 'boolean') {
      if (value) qs.set(key, 'true');
      continue;
    }
    const v = value.trim();
    if (v) qs.set(key, v);
  }
  const s = qs.toString();
  return s ? `?${s}` : '';
}

export async function fetchDocumentRegisterReport(
  query: { type: DocumentRegisterType; dateFrom?: string; dateTo?: string; billNo?: string },
): Promise<DocumentRegisterReport> {
  const qs = buildQuery({
    type: query.type,
    dateFrom: query.dateFrom,
    dateTo: query.dateTo,
    billNo: query.billNo,
  });
  return apiFetch<DocumentRegisterReport>(`/api/reports/document-register${qs}`);
}

export async function fetchSalesAnalysisReport(query: {
  dateFrom?: string;
  dateTo?: string;
  productCode?: string;
  productName?: string;
  mainName?: string;
  customer?: string;
}): Promise<SalesAnalysisReport> {
  const qs = buildQuery(query);
  return apiFetch<SalesAnalysisReport>(`/api/reports/sales-analysis${qs}`);
}

export async function fetchPurchaseAnalysisReport(query: {
  dateFrom?: string;
  dateTo?: string;
  productCode?: string;
  productName?: string;
  mainName?: string;
  supplier?: string;
}): Promise<PurchaseAnalysisReport> {
  const qs = buildQuery(query);
  return apiFetch<PurchaseAnalysisReport>(`/api/reports/purchase-analysis${qs}`);
}

export async function fetchProfitAnalysisReport(query: {
  dateFrom?: string;
  dateTo?: string;
  productCode?: string;
  productName?: string;
  mainName?: string;
}): Promise<ProfitAnalysisReport> {
  const qs = buildQuery(query);
  return apiFetch<ProfitAnalysisReport>(`/api/reports/profit-analysis${qs}`);
}

export async function fetchLedgerAccounts(): Promise<LedgerAccountOption[]> {
  const res = await apiFetch<{ accounts: LedgerAccountOption[] }>('/api/reports/ledger-accounts');
  return res.accounts ?? [];
}

export async function fetchLedgerReport(query: {
  accountCode: string;
  dateFrom?: string;
  dateTo?: string;
}): Promise<LedgerReport> {
  const qs = buildQuery({
    accountCode: query.accountCode,
    dateFrom: query.dateFrom,
    dateTo: query.dateTo,
  });
  return apiFetch<LedgerReport>(`/api/reports/ledger${qs}`);
}

export async function fetchTrialBalanceReport(query: {
  dateFrom?: string;
  dateTo?: string;
  includeZero?: boolean;
}): Promise<TrialBalanceReport> {
  const qs = buildQuery({
    dateFrom: query.dateFrom,
    dateTo: query.dateTo,
    includeZero: query.includeZero,
  });
  return apiFetch<TrialBalanceReport>(`/api/reports/trial-balance${qs}`);
}

export type FinancialStatementEndpoint =
  | 'trading-account'
  | 'profit-loss'
  | 'profit-loss-trading'
  | 'balance-sheet';

export async function fetchFinancialStatementReport(
  endpoint: FinancialStatementEndpoint,
  query: { dateFrom?: string; dateTo?: string },
): Promise<FinancialStatementReport> {
  const qs = buildQuery(query);
  return apiFetch<FinancialStatementReport>(`/api/reports/${endpoint}${qs}`);
}

export async function fetchOpeningStockReport(query: {
  productCode?: string;
  productName?: string;
  mainName?: string;
  productType?: string;
  asOnDate?: string;
  includeZero?: boolean;
}): Promise<OpeningStockReport> {
  const qs = buildQuery(query);
  return apiFetch<OpeningStockReport>(`/api/reports/opening-stock${qs}`);
}

export async function fetchClosingStockReport(query: {
  productCode?: string;
  productName?: string;
  mainName?: string;
  productType?: string;
  godown?: string;
  dateFrom?: string;
  dateTo?: string;
}): Promise<ClosingStockReport> {
  const qs = buildQuery(query);
  return apiFetch<ClosingStockReport>(`/api/reports/closing-stock${qs}`);
}

export async function fetchStockDetailsSummaryReport(query: {
  productCode?: string;
  productName?: string;
  mainName?: string;
  productType?: string;
  includeZero?: boolean;
}): Promise<StockDetailsSummaryReport> {
  const qs = buildQuery(query);
  return apiFetch<StockDetailsSummaryReport>(`/api/reports/stock-details-summary${qs}`);
}

export async function fetchReorderLevelReport(query: {
  productCode?: string;
  productName?: string;
  includeZero?: boolean;
}): Promise<ReorderLevelReport> {
  const qs = buildQuery(query);
  return apiFetch<ReorderLevelReport>(`/api/reports/reorder-level${qs}`);
}

export async function fetchStockMovementReport(query: {
  dateFrom?: string;
  dateTo?: string;
  productCode?: string;
  godown?: string;
  movementType?: string;
}): Promise<StockMovementReport> {
  const qs = buildQuery(query);
  return apiFetch<StockMovementReport>(`/api/reports/stock-movement${qs}`);
}

export async function fetchOutstandingReport(query: {
  asOnDate?: string;
  type?: string;
  partyName?: string;
}): Promise<OutstandingReport> {
  const qs = buildQuery(query);
  return apiFetch<OutstandingReport>(`/api/reports/outstanding${qs}`);
}

export async function fetchDueDayReport(query: {
  asOnDate?: string;
  type?: string;
  partyName?: string;
}): Promise<DueDayReport> {
  const qs = buildQuery(query);
  return apiFetch<DueDayReport>(`/api/reports/due-day${qs}`);
}

export async function fetchDueAmountReport(query: {
  asOnDate?: string;
  type?: string;
  partyName?: string;
}): Promise<DueAmountReport> {
  const qs = buildQuery(query);
  return apiFetch<DueAmountReport>(`/api/reports/due-amount${qs}`);
}
