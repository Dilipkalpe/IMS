import { useCallback, useMemo, useState } from 'react';
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
import { defaultRegisterDateRange, formatMoney } from '../components/reports/reportDateUtils';
import { StandardReportShell } from '../components/reports/StandardReportShell';
import {
  fetchDocumentRegisterReport,
  type DocumentRegisterReport,
} from '../api/reports';
import type { DocumentRegisterScreenConfig } from './documentRegisterConfig';

const defaults = defaultRegisterDateRange();

interface RegisterGridRow {
  id: string;
  serialNo: number;
  billNo: string;
  billDate: string;
  party: string;
  amountDisplay: string;
  status: string;
  narration: string;
}

export function DocumentRegisterScreen({ config }: { config: DocumentRegisterScreenConfig }) {
  const [dateFrom, setDateFrom] = useState(defaults.from);
  const [dateTo, setDateTo] = useState(defaults.to);
  const [billNo, setBillNo] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [report, setReport] = useState<DocumentRegisterReport | null>(null);

  const columns = useMemo(
    () =>
      buildReportGridColumns<RegisterGridRow>([
        { id: 'serialNo', header: 'Sr.', width: 52 },
        { id: 'billNo', header: 'Bill No', width: 130 },
        { id: 'billDate', header: 'Date', width: 110 },
        { id: 'party', header: config.partyLabel, minWidth: 160 },
        { id: 'amountDisplay', header: 'Amount', width: 120 },
        { id: 'status', header: 'Status', width: 100 },
        { id: 'narration', header: 'Narration', minWidth: 140 },
      ]),
    [config.partyLabel],
  );

  const gridData = useMemo<RegisterGridRow[]>(
    () =>
      (report?.rows ?? []).map((r) => ({
        id: `${r.serialNo}-${r.billNo}`,
        serialNo: r.serialNo,
        billNo: r.billNo,
        billDate: r.billDate,
        party: r.party,
        amountDisplay: r.amountDisplay,
        status: r.status,
        narration: r.narration,
      })),
    [report?.rows],
  );

  const exportColumns = useMemo<ListExportColumn[]>(
    () => columns.map((c) => ({ id: c.id, header: c.header })),
    [columns],
  );

  const exportRows = useMemo(
    () =>
      gridData.map((r) => ({
        serialNo: r.serialNo,
        billNo: r.billNo,
        billDate: r.billDate,
        party: r.party,
        amountDisplay: r.amountDisplay,
        status: r.status,
        narration: r.narration,
      })),
    [gridData],
  );

  const loadReport = useCallback(async () => {
    setBusy(true);
    setError(null);
    try {
      const result = await fetchDocumentRegisterReport({
        type: config.registerType,
        dateFrom,
        dateTo,
        billNo: billNo.trim() || undefined,
      });
      setReport(result);
    } catch (err) {
      setReport(null);
      setError(err instanceof Error ? err.message : 'Failed to load register.');
    } finally {
      setBusy(false);
    }
  }, [billNo, config.registerType, dateFrom, dateTo]);

  const printReport = useCallback(() => {
    if (!report || report.rows.length === 0) return;
    const subtitle = `${report.dateFromLabel} to ${report.dateToLabel} · ${report.documentCount} document(s) · Total ${report.totalAmountDisplay}`;
    openListPrintPreview(config.title, subtitle, exportColumns, exportRows, { autoPrint: true });
  }, [config.title, exportColumns, exportRows, report]);

  const exportExcel = useCallback(() => {
    if (!report || report.rows.length === 0) return;
    exportListToExcelCsv(config.title, exportColumns, exportRows);
  }, [config.title, exportColumns, exportRows, report]);

  const summary = report
    ? `${report.documentCount} document(s) · ${report.dateFromLabel} to ${report.dateToLabel} · Total ${report.totalAmountDisplay}`
    : 'Select dates and click Show.';

  return (
    <StandardReportShell
      title={config.title}
      summary={summary}
      busy={busy}
      error={error}
      filters={
        <>
          <div className="standard-report__field">
            <label htmlFor="reg-date-from">Date From</label>
            <input
              id="reg-date-from"
              type="date"
              className="wpf-subpage-form-input"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
            />
          </div>
          <div className="standard-report__field">
            <label htmlFor="reg-date-to">Date To</label>
            <input
              id="reg-date-to"
              type="date"
              className="wpf-subpage-form-input"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
            />
          </div>
          <div className="standard-report__field">
            <label htmlFor="reg-bill-no">Bill No</label>
            <input
              id="reg-bill-no"
              type="text"
              className="wpf-subpage-form-input"
              value={billNo}
              onChange={(e) => setBillNo(e.target.value)}
            />
          </div>
          <div className="standard-report__actions">
            <button type="button" className="wpf-action-button" disabled={busy} onClick={() => void loadReport()}>
              Show
            </button>
            <button
              type="button"
              className="wpf-action-button"
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
      footer={
        report ? (
          <span>
            Grand Total: {formatMoney(report.totalAmount)} ({report.totalAmountDisplay})
          </span>
        ) : null
      }
    />
  );
}
