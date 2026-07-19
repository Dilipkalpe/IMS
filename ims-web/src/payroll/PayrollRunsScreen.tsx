import { useCallback, useEffect, useMemo, useState } from 'react';
import { probeApiHealth } from '../api/client';
import {
  fetchPayrollRunByNo,
  fetchPayrollRunsPage,
  postPayrollRunPayment,
  processPayrollRun,
  type PayrollRunRecord,
} from '../api/payrollRuns';
import { CorporateDataGrid, type DataGridColumn } from '../components/datagrid/CorporateDataGrid';
import { ListGridArea } from '../components/loading';
import { createListActionColumn } from '../components/transaction/transactionListCrud';
import { TransactionListPagination } from '../components/transaction/TransactionListPagination';
import { LIST_PAGE_SIZES } from '../components/transaction/transactionListQuery';
import { TransactionEntryShell } from '../components/transaction/TransactionEntryShell';
import { RefinedScreenShell } from '../screens/RefinedScreenShell';
import '../sales-invoice/sales-invoice.scss';

interface PayrollRunRow {
  id: string;
  runNo: string;
  period: string;
  employees: string;
  netPay: string;
  status: string;
}

function currentPeriodMonth(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

function formatMoney(value?: number): string {
  const n = Number(value ?? 0);
  return n.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function recordToRow(run: PayrollRunRecord): PayrollRunRow {
  return {
    id: String(run.runNo),
    runNo: String(run.runNo),
    period: run.periodMonth ?? '',
    employees: String(run.employeeCount ?? 0),
    netPay: formatMoney(run.totalNet),
    status: run.status ?? '',
  };
}

export function PayrollRunsScreen() {
  const [records, setRecords] = useState<PayrollRunRecord[]>([]);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState<number>(LIST_PAGE_SIZES[0]);
  const [total, setTotal] = useState(0);
  const [searchInput, setSearchInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState('');
  const [processOpen, setProcessOpen] = useState(false);
  const [periodMonth, setPeriodMonth] = useState(currentPeriodMonth());
  const [bonusPercent, setBonusPercent] = useState('0');
  const [remark, setRemark] = useState('');
  const [processing, setProcessing] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const rows = useMemo(() => records.map(recordToRow), [records]);

  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const apiUp = await probeApiHealth();
      if (!apiUp) {
        setRecords([]);
        setTotal(0);
        setError('API is offline — cannot load payroll runs.');
        return;
      }
      const result = await fetchPayrollRunsPage({
        page,
        limit: pageSize,
        periodMonth: searchInput.trim() || undefined,
      });
      setRecords(result.items ?? []);
      setTotal(result.total ?? 0);
    } catch (err) {
      setRecords([]);
      setTotal(0);
      setError(err instanceof Error ? err.message : 'Failed to load payroll runs.');
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, searchInput]);

  useEffect(() => {
    void reload();
  }, [reload]);

  const handleProcess = async (reprocess = false) => {
    setProcessing(true);
    setError(null);
    try {
      const run = await processPayrollRun({
        periodMonth,
        bonusPercent: Number(bonusPercent) || 0,
        remark,
        reprocess,
      });
      setStatusMessage(`Payroll run #${run.runNo} processed for ${run.periodMonth}.`);
      setProcessOpen(false);
      await reload();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Process failed.';
      if (!reprocess && message.includes('already exists')) {
        const ok = window.confirm(`${message}\n\nReprocess this period?`);
        if (ok) await handleProcess(true);
        return;
      }
      setError(message);
    } finally {
      setProcessing(false);
    }
  };

  const handlePostPayment = async (runNo: number) => {
    if (!window.confirm(`Post payment for payroll run #${runNo}?`)) return;
    try {
      await postPayrollRunPayment(runNo, { remark: 'Web payroll payment' });
      setStatusMessage(`Payment posted for run #${runNo}.`);
      await reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Payment post failed.');
    }
  };

  const handleView = async (runNo: number) => {
    try {
      const run = await fetchPayrollRunByNo(runNo);
      const lines = run.lines?.length ?? 0;
      window.alert(
        `Run #${run.runNo} — ${run.periodMonth}\nEmployees: ${lines}\nNet Pay: ${formatMoney(run.totalNet)}\nStatus: ${run.status}`,
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load run details.');
    }
  };

  const columns = useMemo<DataGridColumn<PayrollRunRow>[]>(
    () => [
      createListActionColumn({
        rowLabel: (row) => row.runNo,
        onEdit: (row) => void handleView(Number(row.runNo)),
        onDelete: () => {},
        editTitle: 'View',
        canEdit: true,
        canDelete: false,
      }),
      { id: 'runNo', header: 'Run No', width: 90, readOnly: true, getValue: (r) => r.runNo },
      { id: 'period', header: 'Period', width: 110, readOnly: true, getValue: (r) => r.period },
      { id: 'employees', header: 'Employees', width: 100, readOnly: true, getValue: (r) => r.employees },
      { id: 'netPay', header: 'Net Pay', width: 120, readOnly: true, getValue: (r) => r.netPay },
      { id: 'status', header: 'Status', width: 100, readOnly: true, getValue: (r) => r.status },
    ],
    [],
  );

  return (
    <RefinedScreenShell className="sales-invoice-list-screen">
      <TransactionEntryShell title="Payroll Runs">
        <div className="si-list-layout fv-list">
          <div className="si-list-toolbar">
            <div className="fv-list__toolbar si-list-toolbar__row">
              <button type="button" className="wpf-action-button" onClick={() => setProcessOpen(true)}>
                Process Payroll
              </button>
              <input
                className="wpf-form-input si-list-toolbar__search"
                placeholder="Filter by period (YYYY-MM)…"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
              />
              <button type="button" className="wpf-action-button" onClick={() => void reload()} disabled={loading}>
                Refresh
              </button>
              {selectedId ? (
                <button
                  type="button"
                  className="wpf-action-button"
                  onClick={() => void handlePostPayment(Number(selectedId))}
                >
                  Post Payment
                </button>
              ) : null}
            </div>
            {(error || statusMessage) ? (
              <p className="si-list-toolbar__status" role="status">{error ?? statusMessage}</p>
            ) : null}
          </div>

          {processOpen ? (
            <div className="si-list-toolbar" style={{ padding: '12px', borderTop: '1px solid var(--border-subtle)' }}>
              <label>
                Period (YYYY-MM){' '}
                <input className="wpf-form-input" value={periodMonth} onChange={(e) => setPeriodMonth(e.target.value)} />
              </label>
              <label>
                Bonus %{' '}
                <input className="wpf-form-input" value={bonusPercent} onChange={(e) => setBonusPercent(e.target.value)} />
              </label>
              <label>
                Remark{' '}
                <input className="wpf-form-input" value={remark} onChange={(e) => setRemark(e.target.value)} />
              </label>
              <button type="button" className="wpf-action-button" disabled={processing} onClick={() => void handleProcess()}>
                Run
              </button>
              <button type="button" className="wpf-action-button" onClick={() => setProcessOpen(false)}>
                Cancel
              </button>
            </div>
          ) : null}

          <ListGridArea loading={loading} empty={rows.length === 0 && !loading}>
            <CorporateDataGrid rows={rows} columns={columns} selectedRowId={selectedId} onSelectedRowIdChange={setSelectedId} />
          </ListGridArea>
          <TransactionListPagination
            page={page}
            totalPages={totalPages}
            pageSize={pageSize}
            total={total}
            pageSizes={LIST_PAGE_SIZES}
            onPageChange={setPage}
            onPageSizeChange={setPageSize}
          />
        </div>
      </TransactionEntryShell>
    </RefinedScreenShell>
  );
}
