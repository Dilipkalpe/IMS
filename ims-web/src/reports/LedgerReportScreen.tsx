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
import { fetchLedgerAccounts, fetchLedgerReport, type LedgerReport } from '../api/reports';

const defaults = defaultSalesAnalysisDateRange();

interface LedgerGridRow {
  id: string;
  serialNo: number | string;
  date: string;
  entryNo: string;
  particular: string;
  drDisplay: string;
  crDisplay: string;
}

export function LedgerReportScreen() {
  const [accounts, setAccounts] = useState<Array<{ code: string; name: string }>>([]);
  const [accountCode, setAccountCode] = useState('');
  const [dateFrom, setDateFrom] = useState(defaults.from);
  const [dateTo, setDateTo] = useState(defaults.to);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [report, setReport] = useState<LedgerReport | null>(null);

  useEffect(() => {
    void fetchLedgerAccounts()
      .then((list) => {
        setAccounts(list);
        if (list.length > 0) setAccountCode(list[0].code);
      })
      .catch(() => setAccounts([]));
  }, []);

  const columns = useMemo(
    () =>
      buildReportGridColumns<LedgerGridRow>([
        { id: 'serialNo', header: 'Sr.', width: 52 },
        { id: 'date', header: 'Date', width: 100 },
        { id: 'entryNo', header: 'Entry No', width: 100 },
        { id: 'particular', header: 'Particular', minWidth: 200 },
        { id: 'drDisplay', header: 'Debit', width: 100 },
        { id: 'crDisplay', header: 'Credit', width: 100 },
      ]),
    [],
  );

  const exportColumns = useMemo<ListExportColumn[]>(
    () => columns.map((c) => ({ id: c.id, header: c.header })),
    [columns],
  );

  const gridData = useMemo<LedgerGridRow[]>(() => {
    if (!report) return [];
    return report.rows.map((r) => ({
      id: String(r.serialNo),
      serialNo: r.serialNo,
      date: r.date,
      entryNo: r.entryNo,
      particular: r.particular,
      drDisplay: r.drDisplay,
      crDisplay: r.crDisplay,
    }));
  }, [report]);

  const loadReport = useCallback(async () => {
    if (!accountCode.trim()) {
      setError('Select an account.');
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const result = await fetchLedgerReport({ accountCode, dateFrom, dateTo });
      setReport(result);
    } catch (err) {
      setReport(null);
      setError(err instanceof Error ? err.message : 'Failed to load ledger.');
    } finally {
      setBusy(false);
    }
  }, [accountCode, dateFrom, dateTo]);

  const exportRows = useMemo(
    () =>
      gridData.map((r) => ({
        serialNo: r.serialNo,
        date: r.date,
        entryNo: r.entryNo,
        particular: r.particular,
        drDisplay: r.drDisplay,
        crDisplay: r.crDisplay,
      })),
    [gridData],
  );

  const printReport = useCallback(() => {
    if (!report || gridData.length === 0) return;
    const subtitle = `${report.accountName} (${report.accountCode}) · ${report.dateFromLabel} to ${report.dateToLabel}`;
    openListPrintPreview('Account Ledger', subtitle, exportColumns, exportRows);
  }, [exportColumns, exportRows, gridData.length, report]);

  const exportExcel = useCallback(() => {
    if (!report || gridData.length === 0) return;
    exportListToExcelCsv('Account Ledger', exportColumns, exportRows);
  }, [exportColumns, exportRows, report, gridData.length]);

  const summary = report
    ? `${report.accountName} · ${report.dateFromLabel} to ${report.dateToLabel} · ${report.transactionCount} txn(s) · Closing ${formatMoney(report.closingBalance)} ${report.closingBalanceSide}`
    : 'Select account and click Show.';

  return (
    <StandardReportShell
      title="Account Ledger"
      summary={summary}
      busy={busy}
      error={error}
      filters={
        <>
          <div className="standard-report__field">
            <label htmlFor="ledger-account">Account</label>
            <select
              id="ledger-account"
              className="wpf-subpage-form-combo"
              value={accountCode}
              onChange={(e) => setAccountCode(e.target.value)}
            >
              {accounts.map((a) => (
                <option key={a.code} value={a.code}>
                  {a.code} — {a.name}
                </option>
              ))}
            </select>
          </div>
          <div className="standard-report__field">
            <label htmlFor="ledger-from">Date From</label>
            <input
              id="ledger-from"
              type="date"
              className="wpf-subpage-form-input"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
            />
          </div>
          <div className="standard-report__field">
            <label htmlFor="ledger-to">Date To</label>
            <input
              id="ledger-to"
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
              disabled={busy || gridData.length === 0}
              onClick={printReport}
            >
              Print
            </button>
            <button
              type="button"
              className="wpf-secondary-button"
              disabled={busy || gridData.length === 0}
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
