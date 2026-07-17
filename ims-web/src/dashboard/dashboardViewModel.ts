import type {
  DashboardAlert,
  DashboardChartSeries,
  DashboardPayload,
  DashboardRow,
  DashboardStat,
  DashboardSummaryLine,
} from '../api/dashboard';

export interface DashboardViewState {
  stats: DashboardStat[];
  activityRows: DashboardRow[];
  summaryLines: DashboardSummaryLine[];
  alerts: DashboardAlert[];
  salesPurchaseChart: DashboardChartSeries;
  inventoryStockChart: DashboardChartSeries;
  stockCategoryChart: DashboardChartSeries;
}

const EMPTY_ROW: DashboardRow = { col1: '—', col2: '—', col3: '—', col4: '—', status: '—' };
const EMPTY_SUMMARY: DashboardSummaryLine = { label: '—', value: '—', iconGlyph: '' };
const EMPTY_ALERT: DashboardAlert = { title: '—', detail: '—', severity: '—', iconGlyph: '' };

function padToFour<T>(items: T[], factory: () => T): T[] {
  const result = [...items];
  while (result.length < 4) result.push(factory());
  return result.slice(0, 4);
}

function extractShortLabel(label: string): string {
  const trimmed = label.trim();
  const paren = trimmed.indexOf('(');
  return paren > 0 ? trimmed.slice(0, paren).trim() : trimmed;
}

function extractCountFromLabel(label: string): number {
  const match = label.match(/\((\d+)\)/);
  return match ? Number(match[1]) || 0 : 0;
}

function parseDashboardNumber(value: string): number {
  const cleaned = value.trim().replace(/,/g, '');
  const n = Number(cleaned);
  return Number.isFinite(n) ? n : 0;
}

function buildInventoryStockChartFromSummary(
  summaryLines: DashboardSummaryLine[],
): DashboardChartSeries | null {
  const labels: string[] = [];
  const qtyValues: number[] = [];
  const productCounts: number[] = [];

  for (const line of summaryLines.slice(0, 4)) {
    if (line.label === '—' || line.value === '—') continue;
    labels.push(extractShortLabel(line.label));
    qtyValues.push(parseDashboardNumber(line.value));
    productCounts.push(extractCountFromLabel(line.label));
  }

  if (labels.length === 0) return null;

  return {
    title: 'Inventory trend by type',
    series1Name: 'Qty on hand',
    series2Name: 'Products',
    series1Color: '#006B9E',
    series2Color: '#00857A',
    labels,
    series1: qtyValues,
    series2: productCounts,
  };
}

function resolveInventoryStockChart(
  charts: DashboardPayload['charts'],
  summaryLines: DashboardSummaryLine[],
): DashboardChartSeries {
  const stockByType = charts.stockByType;
  if (stockByType?.labels?.length) return stockByType;

  const fromSummary = buildInventoryStockChartFromSummary(summaryLines);
  if (fromSummary) return fromSummary;

  return {
    title: 'Inventory trend by type',
    labels: [],
    series1: [],
    series2: [],
  };
}

export function prepareDashboardView(payload: DashboardPayload): DashboardViewState {
  const summaryLines = padToFour(payload.summaryLines ?? [], () => ({ ...EMPTY_SUMMARY }));
  const activityRows = padToFour(payload.rows ?? [], () => ({ ...EMPTY_ROW }));
  const alerts = padToFour(payload.alerts ?? [], () => ({ ...EMPTY_ALERT }));

  return {
    stats: (payload.stats ?? []).slice(0, 4),
    activityRows,
    summaryLines,
    alerts,
    salesPurchaseChart: payload.charts?.salesVsPurchase ?? { title: '', labels: [] },
    inventoryStockChart: resolveInventoryStockChart(payload.charts, summaryLines),
    stockCategoryChart: payload.charts?.stockByCategory ?? { title: '', labels: [], slices: [] },
  };
}
