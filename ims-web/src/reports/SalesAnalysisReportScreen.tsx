import { useCallback, useEffect, useMemo, useState } from 'react';
import { CorporateDataGrid } from '../components/datagrid/CorporateDataGrid';
import {
  buildReportGridColumns,
  REPORT_DATA_GRID_PROPS,
} from '../components/reports/reportGridColumns';
import {
  exportListToExcelCsv,
  openListPrintPreview,
  type ListExportColumn,
} from '../components/transaction/listExport';
import {
  defaultSalesAnalysisDateRange,
  formatMoney,
} from '../components/reports/reportDateUtils';
import { StandardReportShell } from '../components/reports/StandardReportShell';
import { fetchProductMainGroupNames } from '../api/productMainGroups';
import { fetchSalesAnalysisReport, type SalesAnalysisReport } from '../api/reports';

const defaults = defaultSalesAnalysisDateRange();
const ALL_GROUPS = '(All)';

function formatPct(value: number): string {
  return `${value.toFixed(1)}%`;
}

interface AnalysisGridRow {
  id: string;
  serialNo: number | string;
  productId: string;
  productName: string;
  mainGroup: string;
  customer: string;
  qty: number | string;
  revenue: string;
  discount: string;
  cogs: string;
  grossProfit: string;
  marginPct: string;
  invoiceCount: number | string;
}

export function SalesAnalysisReportScreen() {
  const [productCode, setProductCode] = useState('');
  const [productName, setProductName] = useState('');
  const [mainName, setMainName] = useState(ALL_GROUPS);
  const [customer, setCustomer] = useState('');
  const [dateFrom, setDateFrom] = useState(defaults.from);
  const [dateTo, setDateTo] = useState(defaults.to);
  const [mainGroups, setMainGroups] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [report, setReport] = useState<SalesAnalysisReport | null>(null);

  useEffect(() => {
    void fetchProductMainGroupNames()
      .then((names) => setMainGroups(names))
      .catch(() => setMainGroups([]));
  }, []);

  const columns = useMemo(
    () =>
      buildReportGridColumns<AnalysisGridRow>([
        { id: 'serialNo', header: 'Sr.', width: 52 },
        { id: 'productId', header: 'Product ID', width: 90 },
        { id: 'productName', header: 'Product Name', minWidth: 140 },
        { id: 'mainGroup', header: 'Main Group', width: 140 },
        { id: 'customer', header: 'Customer', width: 120 },
        { id: 'qty', header: 'Qty', width: 75 },
        { id: 'revenue', header: 'Revenue', width: 95 },
        { id: 'discount', header: 'Discount', width: 85 },
        { id: 'cogs', header: 'COGS', width: 85 },
        { id: 'grossProfit', header: 'Gross Profit', width: 95 },
        { id: 'marginPct', header: 'Margin %', width: 85 },
        { id: 'invoiceCount', header: 'Invoices', width: 65 },
      ]),
    [],
  );

  const exportColumns = useMemo<ListExportColumn[]>(
    () => columns.map((c) => ({ id: c.id, header: c.header })),
    [columns],
  );

  const gridData = useMemo<AnalysisGridRow[]>(() => {
    if (!report) return [];
    const rows: AnalysisGridRow[] = report.rows.map((r) => ({
      id: `${r.serialNo}-${r.productId}`,
      serialNo: r.serialNo,
      productId: r.productId,
      productName: r.productName,
      mainGroup: r.mainGroup,
      customer: r.customer,
      qty: r.qty,
      revenue: formatMoney(r.revenue),
      discount: formatMoney(r.discount),
      cogs: formatMoney(r.cogs),
      grossProfit: formatMoney(r.grossProfit),
      marginPct: formatPct(r.marginPct),
      invoiceCount: r.invoiceCount,
    }));
    if (report.totals) {
      rows.push({
        id: 'totals',
        serialNo: '',
        productId: '',
        productName: 'TOTAL',
        mainGroup: '',
        customer: '',
        qty: report.totals.qty,
        revenue: formatMoney(report.totals.revenue),
        discount: formatMoney(report.totals.discount),
        cogs: formatMoney(report.totals.cogs),
        grossProfit: formatMoney(report.totals.grossProfit),
        marginPct: formatPct(report.totals.marginPct),
        invoiceCount: report.totals.invoiceCount,
      });
    }
    return rows;
  }, [report]);

  const loadReport = useCallback(async () => {
    setBusy(true);
    setError(null);
    try {
      const result = await fetchSalesAnalysisReport({
        dateFrom,
        dateTo,
        productCode: productCode.trim() || undefined,
        productName: productName.trim() || undefined,
        mainName: mainName === ALL_GROUPS ? undefined : mainName,
        customer: customer.trim() || undefined,
      });
      setReport(result);
    } catch (err) {
      setReport(null);
      setError(err instanceof Error ? err.message : 'Failed to load sales analysis.');
    } finally {
      setBusy(false);
    }
  }, [customer, dateFrom, dateTo, mainName, productCode, productName]);

  useEffect(() => {
    void (async () => {
      setBusy(true);
      setError(null);
      try {
        const result = await fetchSalesAnalysisReport({
          dateFrom: defaults.from,
          dateTo: defaults.to,
        });
        setReport(result);
      } catch (err) {
        setReport(null);
        setError(err instanceof Error ? err.message : 'Failed to load sales analysis.');
      } finally {
        setBusy(false);
      }
    })();
  }, []);

  const exportRows = useMemo(
    () =>
      gridData.map((r) => ({
        serialNo: r.serialNo,
        productId: r.productId,
        productName: r.productName,
        mainGroup: r.mainGroup,
        customer: r.customer,
        qty: r.qty,
        revenue: r.revenue,
        discount: r.discount,
        cogs: r.cogs,
        grossProfit: r.grossProfit,
        marginPct: r.marginPct,
        invoiceCount: r.invoiceCount,
      })),
    [gridData],
  );

  const printReport = useCallback(() => {
    if (!report || report.rows.length === 0) return;
    const subtitle = `${report.dateFromLabel} to ${report.dateToLabel} · Revenue ${formatMoney(report.totals.revenue)}`;
    openListPrintPreview('Sales Analysis Report', subtitle, exportColumns, exportRows);
  }, [exportColumns, exportRows, report]);

  const exportExcel = useCallback(() => {
    if (!report || report.rows.length === 0) return;
    exportListToExcelCsv('Sales Analysis Report', exportColumns, exportRows);
  }, [exportColumns, exportRows, report]);

  const summary = report
    ? `${report.count} product(s) · ${report.dateFromLabel} to ${report.dateToLabel} · Revenue ${formatMoney(report.totals.revenue)}`
    : 'Click Show to generate the report.';

  return (
    <StandardReportShell
      title="Sales Analysis Report"
      summary={summary}
      busy={busy}
      error={error}
      filters={
        <>
          <div className="standard-report__field">
            <label htmlFor="sa-product-code">Product Code</label>
            <input
              id="sa-product-code"
              type="text"
              className="wpf-subpage-form-input"
              value={productCode}
              onChange={(e) => setProductCode(e.target.value)}
            />
          </div>
          <div className="standard-report__field">
            <label htmlFor="sa-product-name">Product Name</label>
            <input
              id="sa-product-name"
              type="text"
              className="wpf-subpage-form-input"
              value={productName}
              onChange={(e) => setProductName(e.target.value)}
            />
          </div>
          <div className="standard-report__field">
            <label htmlFor="sa-main-group">Main Group</label>
            <select
              id="sa-main-group"
              className="wpf-subpage-form-combo"
              value={mainName}
              onChange={(e) => setMainName(e.target.value)}
            >
              <option value={ALL_GROUPS}>{ALL_GROUPS}</option>
              {mainGroups.map((g) => (
                <option key={g} value={g}>
                  {g}
                </option>
              ))}
            </select>
          </div>
          <div className="standard-report__field">
            <label htmlFor="sa-customer">Customer</label>
            <input
              id="sa-customer"
              type="text"
              className="wpf-subpage-form-input"
              value={customer}
              onChange={(e) => setCustomer(e.target.value)}
            />
          </div>
          <div className="standard-report__field">
            <label htmlFor="sa-date-from">Date From</label>
            <input
              id="sa-date-from"
              type="date"
              className="wpf-subpage-form-input"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
            />
          </div>
          <div className="standard-report__field">
            <label htmlFor="sa-date-to">Date To</label>
            <input
              id="sa-date-to"
              type="date"
              className="wpf-subpage-form-input"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
            />
          </div>
          <div className="standard-report__actions">
            <button type="button" className="wpf-action-button" disabled={busy} onClick={() => void loadReport()}>
              Show
            </button>
            <button
              type="button"
              className="wpf-secondary-button"
              disabled={busy || !report?.rows.length}
              onClick={printReport}
            >
              Print
            </button>
            <button
              type="button"
              className="wpf-secondary-button"
              disabled={busy || !report?.rows.length}
              onClick={exportExcel}
            >
              Export Excel
            </button>
          </div>
        </>
      }
      grid={<CorporateDataGrid columns={columns} data={gridData} {...REPORT_DATA_GRID_PROPS} />}
    />
  );
}
