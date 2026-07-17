import { useCallback, useEffect, useMemo, useState } from 'react';
import { CorporateDataGrid, type DataGridColumn } from '../components/datagrid/CorporateDataGrid';
import { LoadingHost } from '../components/loading';
import { TransactionListPagination } from '../components/transaction/TransactionListPagination';
import { LIST_PAGE_SIZES } from '../components/transaction/transactionListQuery';
import { useListNewShortcut } from '../components/transaction/useListNewShortcut';
import { probeApiHealth } from '../api/client';
import { fetchCashEntryList, type CashEntryRecord } from '../api/pettyCash';
import { useAppNavigation } from '../context/AppNavigationContext';
import { RefinedScreenShell } from '../screens/RefinedScreenShell';
import { TransactionEntryShell } from '../components/transaction/TransactionEntryShell';
import '../sales-invoice/sales-invoice.scss';
import './finance-voucher.scss';

interface PettyCashListRow {
  id: string;
  entryNo: number;
  date: string;
  lineCount: number;
  total: string;
  status: string;
}

function formatDate(iso?: string): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString('en-IN');
}

function recordToRow(r: CashEntryRecord): PettyCashListRow {
  return {
    id: String(r.entryNo),
    entryNo: r.entryNo,
    date: formatDate(r.entryDate),
    lineCount: r.lines?.length ?? 0,
    total: (r.totalAmount ?? 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
    status: r.status ?? '',
  };
}

export function PettyCashListScreen() {
  const navigate = useAppNavigation();
  const [rows, setRows] = useState<PettyCashListRow[]>([]);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState<number>(LIST_PAGE_SIZES[0]);
  const [total, setTotal] = useState(0);
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [apiReady, setApiReady] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  const columns = useMemo<DataGridColumn<PettyCashListRow>[]>(
    () => [
      { id: 'entryNo', header: 'Entry No', width: 110 },
      { id: 'date', header: 'Date', width: 110 },
      { id: 'lineCount', header: 'Lines', width: 80 },
      { id: 'total', header: 'Total', width: 120 },
      { id: 'status', header: 'Status', width: 90 },
    ],
    [],
  );

  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const apiUp = await probeApiHealth();
      setApiReady(apiUp);
      if (!apiUp) {
        setRows([]);
        setTotal(0);
        setError('API is offline — cannot load petty cash entries.');
        return;
      }
      const result = await fetchCashEntryList({ page, limit: pageSize, search });
      setRows((result.items ?? []).map(recordToRow));
      setTotal(result.total ?? 0);
    } catch (err) {
      setRows([]);
      setTotal(0);
      setError(err instanceof Error ? err.message : 'Failed to load entries.');
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, search]);

  useEffect(() => {
    void reload();
  }, [reload]);

  useEffect(() => {
    const t = window.setTimeout(() => setSearch(searchInput.trim()), 300);
    return () => window.clearTimeout(t);
  }, [searchInput]);

  useEffect(() => {
    setPage(1);
  }, [search, pageSize]);

  const openNew = useCallback(() => {
    navigate('petty-cash-entry');
  }, [navigate]);

  useListNewShortcut(true, openNew);

  return (
    <RefinedScreenShell>
      <TransactionEntryShell title="Petty Cash">
        <div className="fv-list">
          <div className="fv-list__toolbar si-list-toolbar__row">
            <button type="button" className="wpf-action-button" onClick={openNew} title="Ctrl+N">
              New entry
            </button>
            <input
              className="wpf-form-input si-list-toolbar__search"
              placeholder="Search entry no, particular…"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
            />
            <button type="button" className="wpf-action-button" onClick={() => void reload()} disabled={loading}>
              Refresh
            </button>
            {(error || !apiReady) && (
              <span className="fv-entry__status" role="status">
                {error ?? 'API offline'}
              </span>
            )}
          </div>

          <LoadingHost loading={loading} className="fv-list__grid-wrap">
            <CorporateDataGrid
              columns={columns}
              data={rows}
              selectedRowId={selectedId}
              onRowClick={(row) => setSelectedId(row.id)}
              onRowDoubleClick={openNew}
              emptyMessage="No petty cash entries found."
            />
          </LoadingHost>

          <TransactionListPagination
            page={page}
            pageSize={pageSize}
            totalPages={totalPages}
            totalRecords={total}
            loading={loading}
            onPageChange={setPage}
            onPageSizeChange={setPageSize}
          />
        </div>
      </TransactionEntryShell>
    </RefinedScreenShell>
  );
}
