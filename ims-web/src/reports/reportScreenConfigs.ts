import { fetchMasterPage } from '../api/masters';
import { fetchProductMainGroupNames } from '../api/productMainGroups';
import {
  fetchClosingStockReport,
  fetchDueAmountReport,
  fetchDueDayReport,
  fetchFinancialStatementReport,
  fetchOpeningStockReport,
  fetchOutstandingReport,
  fetchProfitAnalysisReport,
  fetchPurchaseAnalysisReport,
  fetchReorderLevelReport,
  fetchStockDetailsSummaryReport,
  fetchStockMovementReport,
  fetchTrialBalanceReport,
  type FinancialStatementEndpoint,
} from '../api/reports';
import { formatMoney, formatNum } from '../components/reports/reportDateUtils';
import type { ConfiguredReportConfig } from './ConfiguredReportScreen';

const ALL_GROUPS = '(All)';
const PARTY_TYPES = [
  { value: 'all', label: 'All' },
  { value: 'receivable', label: 'Receivable' },
  { value: 'payable', label: 'Payable' },
];

const DATE_RANGE_FILTERS = [
  { key: 'dateFrom', label: 'Date From', type: 'date' as const },
  { key: 'dateTo', label: 'Date To', type: 'date' as const },
];

const PRODUCT_FILTERS = [
  { key: 'productCode', label: 'Product Code', type: 'text' as const, placeholder: 'Code…' },
  { key: 'productName', label: 'Product Name', type: 'text' as const, placeholder: 'Name…' },
];

function rowId(row: Record<string, unknown>, index: number): Record<string, unknown> {
  return { ...row, id: String(row.id ?? row.serialNo ?? index) };
}

function financialStatementConfig(
  title: string,
  endpoint: FinancialStatementEndpoint,
): ConfiguredReportConfig {
  return {
    title,
    autoLoad: true,
    filters: [...DATE_RANGE_FILTERS],
    columns: [
      { id: 'serialNo', header: 'Sr.', width: 52 },
      { id: 'section', header: 'Section', width: 120 },
      { id: 'particular', header: 'Particular', minWidth: 200 },
      { id: 'debitDisplay', header: 'Debit', width: 100 },
      { id: 'creditDisplay', header: 'Credit', width: 100 },
    ],
    fetch: (v) => fetchFinancialStatementReport(endpoint, { dateFrom: v.dateFrom, dateTo: v.dateTo }),
    mapRows: (data) => {
      const d = data as { rows: Array<Record<string, unknown>> };
      return (d.rows ?? []).map((r, i) => rowId(r, i));
    },
    buildSummary: (data) => {
      if (!data) return 'Click Show to generate the report.';
      const d = data as {
        dateFromLabel: string;
        dateToLabel: string;
        count: number;
        netAmountLabel: string;
        netAmount: number;
      };
      return `${d.count} row(s) · ${d.dateFromLabel} to ${d.dateToLabel} · ${d.netAmountLabel}: ${formatMoney(Math.abs(d.netAmount))}`;
    },
  };
}

export const trialBalanceReportConfig: ConfiguredReportConfig = {
  title: 'Trial Balance',
  autoLoad: true,
  filters: [
    ...DATE_RANGE_FILTERS,
    { key: 'includeZero', label: 'Include zero balances', type: 'checkbox' },
  ],
  columns: [
    { id: 'serialNo', header: 'Sr.', width: 52 },
    { id: 'accountCode', header: 'Code', width: 80 },
    { id: 'accountName', header: 'Account', minWidth: 180 },
    { id: 'debitDisplay', header: 'Debit', width: 100 },
    { id: 'creditDisplay', header: 'Credit', width: 100 },
  ],
  fetch: (v) =>
    fetchTrialBalanceReport({
      dateFrom: v.dateFrom,
      dateTo: v.dateTo,
      includeZero: v.includeZero === 'true',
    }),
  mapRows: (data) => {
    const d = data as { rows: Array<Record<string, unknown>> };
    return (d.rows ?? []).map((r, i) => {
      const row = rowId(r, i);
      if (row.debitDisplay == null && row.drDisplay != null) row.debitDisplay = row.drDisplay;
      if (row.creditDisplay == null && row.crDisplay != null) row.creditDisplay = row.crDisplay;
      return row;
    });
  },
  buildSummary: (data) => {
    if (!data) return 'Click Show to generate the report.';
    const d = data as {
      dateFromLabel: string;
      dateToLabel: string;
      accountCount: number;
      totalDrDisplay: string;
      totalCrDisplay: string;
      isBalanced: boolean;
    };
    return `${d.accountCount} account(s) · ${d.dateFromLabel} to ${d.dateToLabel} · Dr ${d.totalDrDisplay} / Cr ${d.totalCrDisplay}${d.isBalanced ? ' · Balanced' : ' · Out of balance'}`;
  },
};

export const tradingAccountReportConfig = financialStatementConfig('Trading Statement', 'trading-account');
export const profitLossReportConfig = financialStatementConfig('Income Statement', 'profit-loss');
export const profitLossTradingReportConfig = financialStatementConfig(
  'Income Statement (Full)',
  'profit-loss-trading',
);
export const balanceSheetReportConfig = financialStatementConfig('Balance Sheet', 'balance-sheet');

export const openingStockReportConfig: ConfiguredReportConfig = {
  title: 'Opening Inventory',
  autoLoad: true,
  filters: [
    ...PRODUCT_FILTERS,
    {
      key: 'mainName',
      label: 'Main Group',
      type: 'select',
      defaultValue: ALL_GROUPS,
      loadOptions: async () => {
        const names = await fetchProductMainGroupNames();
        return [{ value: ALL_GROUPS, label: ALL_GROUPS }, ...names.map((n) => ({ value: n, label: n }))];
      },
    },
    { key: 'asOnDate', label: 'As On Date', type: 'date' },
    { key: 'includeZero', label: 'Include zero qty', type: 'checkbox' },
  ],
  columns: [
    { id: 'serialNo', header: 'Sr.', width: 52 },
    { id: 'itemId', header: 'Item Code', width: 100 },
    { id: 'itemName', header: 'Item Name', minWidth: 160 },
    { id: 'unit', header: 'Unit', width: 60 },
    { id: 'qty', header: 'Qty', width: 80 },
    { id: 'rate', header: 'Rate', width: 90, money: true },
    { id: 'valuation', header: 'Valuation', width: 100, money: true },
  ],
  fetch: (v) =>
    fetchOpeningStockReport({
      productCode: v.productCode,
      productName: v.productName,
      mainName: v.mainName === ALL_GROUPS ? undefined : v.mainName,
      asOnDate: v.asOnDate,
      includeZero: v.includeZero === 'true',
    }),
  mapRows: (data) => {
    const d = data as { rows: Array<Record<string, unknown>> };
    return d.rows.map((r, i) => rowId(r, i));
  },
  buildSummary: (data) => {
    if (!data) return 'Click Show to generate the report.';
    const d = data as { dateLabel: string; count: number; totalValuation: number };
    return `${d.count} item(s) · As on ${d.dateLabel} · Valuation ${formatMoney(d.totalValuation)}`;
  },
};

export const closingStockReportConfig: ConfiguredReportConfig = {
  title: 'Closing Inventory',
  autoLoad: true,
  filters: [...PRODUCT_FILTERS, ...DATE_RANGE_FILTERS],
  columns: [
    { id: 'serialNo', header: 'Sr.', width: 52 },
    { id: 'productId', header: 'Code', width: 90 },
    { id: 'productName', header: 'Name', minWidth: 140 },
    { id: 'opStock', header: 'Op. Stock', width: 85 },
    { id: 'inward', header: 'Inward', width: 80 },
    { id: 'outward', header: 'Outward', width: 80 },
    { id: 'closingStock', header: 'Cl. Stock', width: 85 },
    { id: 'avgRate', header: 'Rate', width: 85, money: true },
    { id: 'valuation', header: 'Value', width: 95, money: true },
  ],
  mapRows: (data) => {
    const d = data as { rows: Array<Record<string, unknown>> };
    return d.rows.map((r, i) => rowId(r, i));
  },
  fetch: (v) =>
    fetchClosingStockReport({
      productCode: v.productCode,
      productName: v.productName,
      dateFrom: v.dateFrom,
      dateTo: v.dateTo,
    }),
  buildSummary: (data) => {
    if (!data) return 'Click Show to generate the report.';
    const d = data as { dateFromLabel?: string; dateToLabel?: string; count: number; totalValuation?: number };
    const period =
      d.dateFromLabel && d.dateToLabel ? `${d.dateFromLabel} to ${d.dateToLabel}` : 'selected period';
    const val = d.totalValuation != null ? ` · Value ${formatMoney(d.totalValuation)}` : '';
    return `${d.count} item(s) · ${period}${val}`;
  },
};

export const stockSummaryReportConfig: ConfiguredReportConfig = {
  title: 'Inventory Summary',
  autoLoad: true,
  filters: [
    ...PRODUCT_FILTERS,
    {
      key: 'mainName',
      label: 'Main Group',
      type: 'select',
      defaultValue: ALL_GROUPS,
      loadOptions: async () => {
        const names = await fetchProductMainGroupNames();
        return [{ value: ALL_GROUPS, label: ALL_GROUPS }, ...names.map((n) => ({ value: n, label: n }))];
      },
    },
    { key: 'includeZero', label: 'Include zero qty', type: 'checkbox' },
  ],
  columns: [
    { id: 'serialNo', header: 'Sr.', width: 52 },
    { id: 'productCode', header: 'Code', width: 90 },
    { id: 'productName', header: 'Name', minWidth: 140 },
    { id: 'mainGroup', header: 'Main Group', width: 110 },
    { id: 'onHandQty', header: 'On Hand', width: 85 },
    { id: 'purchaseRate', header: 'Rate', width: 85, money: true },
    { id: 'stockValue', header: 'Value', width: 95, money: true },
    { id: 'reorderLevel', header: 'Reorder', width: 80 },
    { id: 'shortageQty', header: 'Shortage', width: 85 },
    { id: 'status', header: 'Status', width: 110 },
  ],
  fetch: (v) =>
    fetchStockDetailsSummaryReport({
      productCode: v.productCode,
      productName: v.productName,
      mainName: v.mainName === ALL_GROUPS ? undefined : v.mainName,
      includeZero: v.includeZero === 'true',
    }),
  mapRows: (data) => {
    const d = data as { rows: Array<Record<string, unknown>> };
    return d.rows.map((r, i) => rowId(r, i));
  },
  buildSummary: (data) => {
    if (!data) return 'Click Show to generate the report.';
    const d = data as {
      count: number;
      belowReorderCount: number;
      totalStockValue: number;
    };
    return `${d.count} product(s) · Below reorder: ${d.belowReorderCount} · Stock value ${formatMoney(d.totalStockValue)}`;
  },
};

export const reorderLevelReportConfig: ConfiguredReportConfig = {
  title: 'Low Stock',
  autoLoad: true,
  filters: [
    ...PRODUCT_FILTERS,
    { key: 'includeZero', label: 'Include no reorder set', type: 'checkbox' },
  ],
  columns: [
    { id: 'serialNo', header: 'Sr.', width: 52 },
    { id: 'productId', header: 'Code', width: 90 },
    { id: 'productName', header: 'Name', minWidth: 160 },
    { id: 'unit', header: 'Unit', width: 60 },
    { id: 'onHand', header: 'On Hand', width: 85 },
    { id: 'reorderLevel', header: 'Reorder', width: 85 },
    { id: 'shortage', header: 'Shortage', width: 85 },
    { id: 'status', header: 'Status', width: 120 },
  ],
  fetch: (v) =>
    fetchReorderLevelReport({
      productCode: v.productCode,
      productName: v.productName,
      includeZero: v.includeZero === 'true',
    }),
  mapRows: (data) => {
    const d = data as { rows: Array<Record<string, unknown>> };
    return d.rows.map((r, i) => rowId(r, i));
  },
  buildSummary: (data) => {
    if (!data) return 'Click Show to generate the report.';
    const d = data as { count: number; belowCount: number; totalShortage: number };
    return `${d.count} product(s) · Below reorder: ${d.belowCount} · Total shortage ${formatNum(d.totalShortage)}`;
  },
};

export const stockMovementReportConfig: ConfiguredReportConfig = {
  title: 'Stock Activity',
  autoLoad: true,
  filters: [
    ...DATE_RANGE_FILTERS,
    { key: 'productCode', label: 'Product Code', type: 'text', placeholder: 'Code…' },
    { key: 'godown', label: 'Godown', type: 'text', placeholder: 'Godown…' },
    {
      key: 'movementType',
      label: 'Movement',
      type: 'select',
      defaultValue: 'All',
      options: [
        { value: 'All', label: 'All' },
        { value: 'Receipt', label: 'Receipt' },
        { value: 'Issue', label: 'Issue' },
        { value: 'Transfer', label: 'Transfer' },
      ],
    },
  ],
  columns: [
    { id: 'serialNo', header: 'Sr.', width: 52 },
    { id: 'date', header: 'Date', width: 95 },
    { id: 'entryNo', header: 'Entry No', width: 100 },
    { id: 'movementType', header: 'Type', width: 90 },
    { id: 'productCode', header: 'Code', width: 90 },
    { id: 'productName', header: 'Product', minWidth: 130 },
    { id: 'fromGodown', header: 'From', width: 90 },
    { id: 'toGodown', header: 'To', width: 90 },
    { id: 'inQty', header: 'In', width: 70 },
    { id: 'outQty', header: 'Out', width: 70 },
  ],
  fetch: (v) =>
    fetchStockMovementReport({
      dateFrom: v.dateFrom,
      dateTo: v.dateTo,
      productCode: v.productCode,
      godown: v.godown,
      movementType: v.movementType === 'All' ? undefined : v.movementType,
    }),
  mapRows: (data) => {
    const d = data as { rows: Array<Record<string, unknown>> };
    return d.rows.map((r, i) => rowId(r, i));
  },
  buildSummary: (data) => {
    if (!data) return 'Click Show to generate the report.';
    const d = data as { dateFromLabel: string; dateToLabel: string; count: number };
    return `${d.count} movement(s) · ${d.dateFromLabel} to ${d.dateToLabel}`;
  },
};

export const profitAnalysisReportConfig: ConfiguredReportConfig = {
  title: 'Profitability',
  autoLoad: true,
  filters: [
    ...PRODUCT_FILTERS,
    {
      key: 'mainName',
      label: 'Main Group',
      type: 'select',
      defaultValue: ALL_GROUPS,
      loadOptions: async () => {
        const names = await fetchProductMainGroupNames();
        return [{ value: ALL_GROUPS, label: ALL_GROUPS }, ...names.map((n) => ({ value: n, label: n }))];
      },
    },
    ...DATE_RANGE_FILTERS,
  ],
  columns: [
    { id: 'serialNo', header: 'Sr.', width: 52 },
    { id: 'productId', header: 'Code', width: 90 },
    { id: 'productName', header: 'Name', minWidth: 140 },
    { id: 'mainGroup', header: 'Group', width: 100 },
    { id: 'qty', header: 'Qty', width: 75 },
    { id: 'revenue', header: 'Revenue', width: 95, money: true },
    { id: 'cogs', header: 'COGS', width: 90, money: true },
    { id: 'grossProfit', header: 'Gross Profit', width: 100, money: true },
    { id: 'marginPct', header: 'Margin %', width: 85, pct: true },
  ],
  fetch: (v) =>
    fetchProfitAnalysisReport({
      dateFrom: v.dateFrom,
      dateTo: v.dateTo,
      productCode: v.productCode,
      productName: v.productName,
      mainName: v.mainName === ALL_GROUPS ? undefined : v.mainName,
    }),
  mapRows: (data) => {
    const d = data as { rows: Array<Record<string, unknown>> };
    return d.rows.map((r, i) => rowId(r, i));
  },
  buildSummary: (data) => {
    if (!data) return 'Click Show to generate the report.';
    const d = data as {
      dateFromLabel: string;
      dateToLabel: string;
      count: number;
      totals: { grossProfit: number; revenue: number };
    };
    return `${d.count} product(s) · ${d.dateFromLabel} to ${d.dateToLabel} · GP ${formatMoney(d.totals.grossProfit)}`;
  },
};

export const purchaseAnalysisReportConfig: ConfiguredReportConfig = {
  title: 'Spend Analysis',
  autoLoad: true,
  filters: [
    ...PRODUCT_FILTERS,
    {
      key: 'mainName',
      label: 'Main Group',
      type: 'select',
      defaultValue: ALL_GROUPS,
      loadOptions: async () => {
        const names = await fetchProductMainGroupNames();
        return [{ value: ALL_GROUPS, label: ALL_GROUPS }, ...names.map((n) => ({ value: n, label: n }))];
      },
    },
    { key: 'supplier', label: 'Supplier', type: 'text', placeholder: 'Supplier…' },
    ...DATE_RANGE_FILTERS,
  ],
  columns: [
    { id: 'serialNo', header: 'Sr.', width: 52 },
    { id: 'productId', header: 'Code', width: 90 },
    { id: 'productName', header: 'Name', minWidth: 140 },
    { id: 'mainGroup', header: 'Group', width: 100 },
    { id: 'supplier', header: 'Supplier', width: 120 },
    { id: 'qty', header: 'Qty', width: 75 },
    { id: 'amount', header: 'Amount', width: 95, money: true },
    { id: 'discount', header: 'Discount', width: 90, money: true },
    { id: 'invoiceCount', header: 'Bills', width: 65 },
  ],
  fetch: (v) =>
    fetchPurchaseAnalysisReport({
      dateFrom: v.dateFrom,
      dateTo: v.dateTo,
      productCode: v.productCode,
      productName: v.productName,
      mainName: v.mainName === ALL_GROUPS ? undefined : v.mainName,
      supplier: v.supplier,
    }),
  mapRows: (data) => {
    const d = data as { rows: Array<Record<string, unknown>> };
    return d.rows.map((r, i) => rowId(r, i));
  },
  buildSummary: (data) => {
    if (!data) return 'Click Show to generate the report.';
    const d = data as {
      dateFromLabel: string;
      dateToLabel: string;
      count: number;
      totals: { amount: number };
    };
    return `${d.count} product(s) · ${d.dateFromLabel} to ${d.dateToLabel} · Amount ${formatMoney(d.totals.amount)}`;
  },
};

export const outstandingReportConfig: ConfiguredReportConfig = {
  title: 'Open Balances',
  autoLoad: true,
  filters: [
    { key: 'asOnDate', label: 'As On Date', type: 'date' },
    { key: 'type', label: 'Type', type: 'select', defaultValue: 'all', options: PARTY_TYPES },
    { key: 'partyName', label: 'Party Name', type: 'text', placeholder: 'Party…' },
  ],
  columns: [
    { id: 'serialNo', header: 'Sr.', width: 52 },
    { id: 'partyType', header: 'Type', width: 90 },
    { id: 'partyName', header: 'Party', minWidth: 140 },
    { id: 'docNo', header: 'Doc No', width: 100 },
    { id: 'invoiceDate', header: 'Bill Date', width: 95 },
    { id: 'dueDate', header: 'Due Date', width: 95 },
    { id: 'billAmount', header: 'Bill Amt', width: 95, money: true },
    { id: 'paidAmount', header: 'Paid', width: 90, money: true },
    { id: 'balanceDue', header: 'Balance', width: 95, money: true },
    { id: 'dueStatus', header: 'Status', width: 90 },
  ],
  fetch: (v) =>
    fetchOutstandingReport({
      asOnDate: v.asOnDate,
      type: v.type,
      partyName: v.partyName,
    }),
  mapRows: (data) => {
    const d = data as { rows: Array<Record<string, unknown>> };
    return d.rows.map((r, i) => rowId(r, i));
  },
  buildSummary: (data) => {
    if (!data) return 'Click Show to generate the report.';
    const d = data as {
      asOnDateLabel: string;
      count: number;
      totals: { totalReceivable: number; totalPayable: number };
    };
    return `${d.count} invoice(s) · As on ${d.asOnDateLabel} · Recv ${formatMoney(d.totals.totalReceivable)} · Pay ${formatMoney(d.totals.totalPayable)}`;
  },
};

export const dueDayReportConfig: ConfiguredReportConfig = {
  title: 'Aging (Due Date)',
  autoLoad: true,
  filters: [
    { key: 'asOnDate', label: 'As On Date', type: 'date' },
    { key: 'type', label: 'Type', type: 'select', defaultValue: 'all', options: PARTY_TYPES },
    { key: 'partyName', label: 'Party Name', type: 'text', placeholder: 'Party…' },
  ],
  columns: [
    { id: 'serialNo', header: 'Sr.', width: 52 },
    { id: 'partyType', header: 'Type', width: 90 },
    { id: 'partyName', header: 'Party', minWidth: 140 },
    { id: 'docNo', header: 'Doc No', width: 100 },
    { id: 'dueDate', header: 'Due Date', width: 95 },
    { id: 'dueDays', header: 'Due Days', width: 80 },
    { id: 'dueBucket', header: 'Bucket', width: 90 },
    { id: 'balanceDue', header: 'Balance', width: 100, money: true },
  ],
  fetch: (v) =>
    fetchDueDayReport({
      asOnDate: v.asOnDate,
      type: v.type,
      partyName: v.partyName,
    }),
  mapRows: (data) => {
    const d = data as { rows: Array<Record<string, unknown>> };
    return d.rows.map((r, i) => rowId(r, i));
  },
  buildSummary: (data) => {
    if (!data) return 'Click Show to generate the report.';
    const d = data as { asOnDateLabel: string; count: number; totals: { totalAmount: number } };
    return `${d.count} row(s) · As on ${d.asOnDateLabel} · Total ${formatMoney(d.totals.totalAmount)}`;
  },
};

export const dueAmountReportConfig: ConfiguredReportConfig = {
  title: 'Aging (By Value)',
  autoLoad: true,
  filters: [
    { key: 'asOnDate', label: 'As On Date', type: 'date' },
    { key: 'type', label: 'Type', type: 'select', defaultValue: 'all', options: PARTY_TYPES },
    { key: 'partyName', label: 'Party Name', type: 'text', placeholder: 'Party…' },
  ],
  columns: [
    { id: 'serialNo', header: 'Sr.', width: 52 },
    { id: 'slab', header: 'Amount Slab', minWidth: 140 },
    { id: 'invoiceCount', header: 'Invoices', width: 80 },
    { id: 'partyCount', header: 'Parties', width: 80 },
    { id: 'amount', header: 'Amount', width: 110, money: true },
  ],
  fetch: (v) =>
    fetchDueAmountReport({
      asOnDate: v.asOnDate,
      type: v.type,
      partyName: v.partyName,
    }),
  mapRows: (data) => {
    const d = data as { rows: Array<Record<string, unknown>> };
    return d.rows.map((r, i) => rowId(r, i));
  },
  buildSummary: (data) => {
    if (!data) return 'Click Show to generate the report.';
    const d = data as { asOnDateLabel: string; count: number; totals: { totalAmount: number } };
    return `${d.count} slab(s) · As on ${d.asOnDateLabel} · Total ${formatMoney(d.totals.totalAmount)}`;
  },
};

export const productionReportConfig: ConfiguredReportConfig = {
  title: 'Production Metrics',
  autoLoad: true,
  filters: [
    { key: 'status', label: 'Status', type: 'text', placeholder: 'Open, Completed…' },
    { key: 'search', label: 'Search', type: 'text', placeholder: 'Job no, item…' },
  ],
  columns: [
    { id: 'productionNo', header: 'Job No', width: 90 },
    { id: 'productionDate', header: 'Date', width: 110 },
    { id: 'manufacturingItemName', header: 'Product', minWidth: 160 },
    { id: 'finalQty', header: 'Output', width: 80 },
    { id: 'productionAmount', header: 'Amount', width: 110, money: true },
    { id: 'status', header: 'Status', width: 110 },
  ],
  fetch: async (v) => {
    const result = await fetchMasterPage('production-orders', {
      page: 1,
      limit: 500,
      search: v.search,
      query: v.status ? { status: v.status } : undefined,
    });
    return {
      rows: result.items.map((row, index) => ({
        ...row,
        id: String(row._id ?? row.productionNo ?? index),
        productionDate: row.productionDate
          ? new Date(String(row.productionDate)).toLocaleDateString('en-IN')
          : '',
      })),
      count: result.total,
    };
  },
  mapRows: (data) => {
    const d = data as { rows: Array<Record<string, unknown>> };
    return d.rows.map((r, i) => rowId(r, i));
  },
  buildSummary: (data) => {
    if (!data) return 'Click Show to generate the report.';
    const d = data as { count: number; rows: Array<Record<string, unknown>> };
    const totalAmount = d.rows.reduce((sum, row) => sum + Number(row.productionAmount ?? 0), 0);
    return `${d.count} job work record(s) · Total production amount ${formatMoney(totalAmount)}`;
  },
};
