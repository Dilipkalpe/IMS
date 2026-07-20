import { useCallback, useEffect, useMemo, useState } from 'react';
import { apiFetch } from '../api/client';
import { CorporateDataGrid } from '../components/datagrid/CorporateDataGrid';
import {
  buildReportGridColumns,
  REPORT_DATA_GRID_PROPS,
  type ReportGridColumnDef,
} from '../components/reports/reportGridColumns';
import { StandardReportShell } from '../components/reports/StandardReportShell';
import {
  exportListToExcelCsv,
  openListPrintPreview,
  type ListExportColumn,
} from '../components/transaction/listExport';
import { employeeTypeLabel } from './payrollEmployeeTypes';
import { fetchPayslipByPeriod, openDeferredPrintWindow, openPayslipHtmlPreview } from '../api/payrollReports';

type ReportKind = 'tax-summary' | 'staff-hours' | 'payslip';

interface ReportRow {
  id: string;
  [key: string]: string;
}

function currentPeriodMonth(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  return `${y}-${m}`;
}

function recordsFromPayload(payload: unknown): Record<string, unknown>[] {
  if (Array.isArray(payload)) return payload as Record<string, unknown>[];
  if (payload && typeof payload === 'object') {
    const obj = payload as Record<string, unknown>;
    if (Array.isArray(obj.rows)) return obj.rows as Record<string, unknown>[];
    if (Array.isArray(obj.items)) return obj.items as Record<string, unknown>[];
    if (Array.isArray(obj.employees)) return obj.employees as Record<string, unknown>[];
  }
  return [];
}

function formatMoney(value: unknown): string {
  const n = Number(value);
  if (!Number.isFinite(n)) return '';
  return n.toFixed(2);
}

const TAX_SUMMARY_COLUMNS: ReportGridColumnDef[] = [
  { id: 'employeeCode', header: 'Employee', width: 110 },
  { id: 'employeeName', header: 'Name', minWidth: 150 },
  { id: 'employeeTypeLabel', header: 'Type', width: 110 },
  { id: 'gross', header: 'Gross', width: 100 },
  { id: 'tds', header: 'TDS', width: 90 },
  { id: 'netPay', header: 'Net', width: 100 },
];

const STAFF_HOURS_COLUMNS: ReportGridColumnDef[] = [
  { id: 'employeeCode', header: 'Employee', width: 110 },
  { id: 'employeeName', header: 'Name', minWidth: 150 },
  { id: 'employeeTypeLabel', header: 'Type', width: 110 },
  { id: 'daysPresent', header: 'Present', width: 90 },
  { id: 'daysAbsent', header: 'Absent', width: 90 },
  { id: 'paidDays', header: 'Paid Days', width: 90 },
  { id: 'workedHours', header: 'Hours', width: 90 },
];

export function PayrollReportsScreen() {
  const [reportKind, setReportKind] = useState<ReportKind>('tax-summary');
  const [periodMonth, setPeriodMonth] = useState(currentPeriodMonth());
  const [employeeCode, setEmployeeCode] = useState('');
  const [runNo, setRunNo] = useState('');
  const [payslipStatus, setPayslipStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rows, setRows] = useState<ReportRow[]>([]);

  const columnDefs = useMemo(
    () => (reportKind === 'staff-hours' ? STAFF_HOURS_COLUMNS : TAX_SUMMARY_COLUMNS),
    [reportKind],
  );

  const columns = useMemo(() => buildReportGridColumns<ReportRow>(columnDefs), [columnDefs]);

  const exportColumns = useMemo<ListExportColumn[]>(
    () => columnDefs.map((col) => ({ id: col.id, header: col.header })),
    [columnDefs],
  );

  const exportRows = useMemo(
    () => rows.map((row) => Object.fromEntries(columnDefs.map((col) => [col.id, row[col.id] ?? '']))),
    [columnDefs, rows],
  );

  useEffect(() => {
    setRows([]);
    setError(null);
    setPayslipStatus(null);
  }, [reportKind]);

  const viewPayslip = useCallback(async () => {
    if (!/^\d{4}-\d{2}$/.test(periodMonth.trim())) {
      setPayslipStatus('Enter period as YYYY-MM.');
      return;
    }
    if (!employeeCode.trim()) {
      setPayslipStatus('Enter employee code.');
      return;
    }

    const parsedRun = runNo.trim() ? parseInt(runNo, 10) : undefined;
    const payslipInput = {
      periodMonth: periodMonth.trim(),
      employeeCode: employeeCode.trim(),
      runNo: Number.isFinite(parsedRun) ? parsedRun : undefined,
    };

    const previewWin = openDeferredPrintWindow();
    setLoading(true);
    setPayslipStatus(null);
    setError(null);
    try {
      await fetchPayslipByPeriod(payslipInput);
      const outcome = openPayslipHtmlPreview({
        ...payslipInput,
        targetWindow: previewWin ?? undefined,
      });
      if (!outcome.ok) {
        previewWin?.close();
        setPayslipStatus(outcome.message);
        return;
      }
      setPayslipStatus(outcome.message || 'Payslip opened — use browser Print for PDF.');
    } catch (err) {
      previewWin?.close();
      setPayslipStatus(err instanceof Error ? err.message : 'Payslip not found.');
    } finally {
      setLoading(false);
    }
  }, [employeeCode, periodMonth, runNo]);

  const loadReport = useCallback(async () => {
    if (reportKind === 'payslip') {
      await viewPayslip();
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const path =
        reportKind === 'tax-summary'
          ? `/api/payroll-reports/tax-summary?periodMonth=${encodeURIComponent(periodMonth)}`
          : `/api/payroll-reports/staff-hours?periodMonth=${encodeURIComponent(periodMonth)}`;
      const payload = await apiFetch<unknown>(path);
      const records = recordsFromPayload(payload);
      setRows(
        records.map((record, index) => {
          const row: ReportRow = { id: String(record.employeeCode ?? index) };
          for (const col of columnDefs) {
            let val = record[col.id];
            if (col.id === 'employeeTypeLabel' && !val) {
              val = employeeTypeLabel(record.employeeType);
            }
            if (col.id === 'employeeName' && !val) {
              val = record.fullName;
            }
            if (col.id === 'gross' && val == null) val = record.grossPay;
            if (col.id === 'daysPresent' && val == null) val = record.presentDays;
            if (col.id === 'daysAbsent' && val == null) val = record.absentDays;
            if (col.id === 'workedHours' && val == null) val = record.hoursWorked;
            if (col.id === 'gross' || col.id === 'tds' || col.id === 'netPay') {
              row[col.id] = formatMoney(val);
            } else {
              row[col.id] = val == null ? '' : String(val);
            }
          }
          return row;
        }),
      );
    } catch (err) {
      setRows([]);
      setError(err instanceof Error ? err.message : 'Failed to load payroll report.');
    } finally {
      setLoading(false);
    }
  }, [columnDefs, periodMonth, reportKind, viewPayslip]);

  const reportTitle =
    reportKind === 'staff-hours'
      ? 'Staff Hours Report'
      : reportKind === 'payslip'
        ? 'Employee Payslip'
        : 'Payroll Tax Summary';

  const summary =
    reportKind === 'payslip'
      ? payslipStatus ?? 'Enter period and employee code, then View Payslip.'
      : rows.length > 0
        ? `${rows.length} employee(s) · ${periodMonth}`
        : 'Select a report and period, then click Show.';

  const printReport = useCallback(() => {
    if (rows.length === 0) return;
    openListPrintPreview(reportTitle, `Period ${periodMonth}`, exportColumns, exportRows);
  }, [exportColumns, exportRows, periodMonth, reportTitle, rows.length]);

  const exportExcel = useCallback(() => {
    if (rows.length === 0) return;
    exportListToExcelCsv(reportTitle, exportColumns, exportRows);
  }, [exportColumns, exportRows, reportTitle, rows.length]);

  return (
    <StandardReportShell
      title="Payroll Reports"
      summary={summary}
      busy={loading}
      error={error}
      filters={
        <>
          <div className="standard-report__field">
            <label htmlFor="payroll-report-kind">Report</label>
            <select
              id="payroll-report-kind"
              className="wpf-subpage-form-combo"
              value={reportKind}
              onChange={(e) => setReportKind(e.target.value as ReportKind)}
            >
              <option value="tax-summary">Tax summary</option>
              <option value="staff-hours">Staff hours</option>
              <option value="payslip">Payslip (PDF/HTML)</option>
            </select>
          </div>
          <div className="standard-report__field">
            <label htmlFor="payroll-period">Period</label>
            <input
              id="payroll-period"
              className="wpf-subpage-form-input"
              placeholder="YYYY-MM"
              value={periodMonth}
              onChange={(e) => setPeriodMonth(e.target.value)}
            />
          </div>
          {reportKind === 'payslip' ? (
            <>
              <div className="standard-report__field">
                <label htmlFor="payroll-employee">Employee code</label>
                <input
                  id="payroll-employee"
                  className="wpf-subpage-form-input"
                  value={employeeCode}
                  onChange={(e) => setEmployeeCode(e.target.value.toUpperCase())}
                  placeholder="EMP001"
                />
              </div>
              <div className="standard-report__field">
                <label htmlFor="payroll-run-no">Run no (optional)</label>
                <input
                  id="payroll-run-no"
                  className="wpf-subpage-form-input"
                  value={runNo}
                  onChange={(e) => setRunNo(e.target.value)}
                  placeholder="Latest if blank"
                />
              </div>
            </>
          ) : null}
          <div className="standard-report__actions">
            <button
              type="button"
              className="wpf-action-button"
              onClick={() => void loadReport()}
              disabled={loading}
            >
              {reportKind === 'payslip' ? 'View Payslip' : 'Show'}
            </button>
            {reportKind !== 'payslip' ? (
              <>
            <button
              type="button"
              className="wpf-secondary-button"
              disabled={loading || rows.length === 0}
              onClick={printReport}
            >
              Print
            </button>
            <button
              type="button"
              className="wpf-secondary-button"
              disabled={loading || rows.length === 0}
              onClick={exportExcel}
            >
              Export Excel
            </button>
              </>
            ) : null}
          </div>
        </>
      }
      grid={
        reportKind === 'payslip' ? (
          <p className="standard-report__empty-hint">
            Payslip opens in a new window with print-to-PDF support (browser Print → Save as PDF).
          </p>
        ) : (
        <CorporateDataGrid
          columns={columns}
          data={rows}
          emptyMessage="Select a report and period, then click Show."
          {...REPORT_DATA_GRID_PROPS}
        />
        )
      }
    />
  );
}
