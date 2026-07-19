import { useCallback, useEffect, useMemo, useState } from 'react';
import { probeApiHealth } from '../api/client';
import { fetchStockTransfersPage, type StockTransferRecord } from '../api/stockTransfers';
import { CorporateDataGrid, type DataGridColumn } from '../components/datagrid/CorporateDataGrid';
import { ListGridArea } from '../components/loading';
import { createListActionColumn } from '../components/transaction/transactionListCrud';
import { TransactionListPagination } from '../components/transaction/TransactionListPagination';
import { LIST_PAGE_SIZES } from '../components/transaction/transactionListQuery';
import { useListNewShortcut } from '../components/transaction/useListNewShortcut';
import { useAppNavigation } from '../context/AppNavigationContext';
import { RefinedScreenShell } from '../screens/RefinedScreenShell';
import { TransactionEntryShell } from '../components/transaction/TransactionEntryShell';
import { useStockTransferNavIntent } from './context/StockTransferNavIntent';
import '../sales-invoice/sales-invoice.scss';

interface TransferListRow {
  id: string;
  entryNo: string;
  fromGodown: string;
  toGodown: string;
  status: string;
  remark: string;
}

function recordToRow(transfer: StockTransferRecord): TransferListRow {
  return {
    id: transfer.entryNo,
    entryNo: transfer.entryNo,
    fromGodown: transfer.fromGodown ?? '',
    toGodown: transfer.toGodown ?? '',
    status: transfer.status ?? '',
    remark: transfer.remark ?? '',
  };
}

export function StockTransferListScreen() {
  const navigate = useAppNavigation();
  const { publishOpenIntent } = useStockTransferNavIntent();
  const [records, setRecords] = useState<StockTransferRecord[]>([]);
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
  const rows = useMemo(() => records.map(recordToRow), [records]);

  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const apiUp = await probeApiHealth();
      setApiReady(apiUp);
      if (!apiUp) {
        setRecords([]);
        setTotal(0);
        setError('API is offline — cannot load transfers.');
        return;
      }
      const result = await fetchStockTransfersPage({ page, limit: pageSize, search });
      setRecords(result.items ?? []);
      setTotal(result.total ?? 0);
    } catch (err) {
      setRecords([]);
      setTotal(0);
      setError(err instanceof Error ? err.message : 'Failed to load transfers.');
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
    publishOpenIntent({ type: 'new', returnNavKey: 'stock-transfer' });
    navigate('stock-transfer-entry');
  }, [navigate, publishOpenIntent]);

  const columns = useMemo<DataGridColumn<TransferListRow>[]>(
    () => [
      createListActionColumn({
        rowLabel: (row) => row.entryNo,
        onEdit: () => openNew(),
        onDelete: () => {},
        canEdit: true,
        canDelete: false,
        editTitle: 'New Transfer',
      }),
      { id: 'entryNo', header: 'Entry No', width: 120, readOnly: true, getValue: (r) => r.entryNo },
      { id: 'fromGodown', header: 'From', width: 120, readOnly: true, getValue: (r) => r.fromGodown },
      { id: 'toGodown', header: 'To', width: 120, readOnly: true, getValue: (r) => r.toGodown },
      { id: 'status', header: 'Status', width: 100, readOnly: true, getValue: (r) => r.status },
      { id: 'remark', header: 'Remark', minWidth: 160, readOnly: true, getValue: (r) => r.remark },
    ],
    [openNew],
  );

  useListNewShortcut(true, openNew);

  return (
    <RefinedScreenShell className="sales-invoice-list-screen">
      <TransactionEntryShell title="Stock Transfers">
        <div className="si-list-layout fv-list">
          <div className="si-list-toolbar">
            <div className="fv-list__toolbar si-list-toolbar__row">
              <button type="button" className="wpf-action-button" onClick={openNew} title="Ctrl+N">
                <span className="wpf-icontext" aria-hidden="true">&#xE710;</span> New Transfer
              </button>
              <input
                className="wpf-form-input si-list-toolbar__search"
                placeholder="Search entry, godown…"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
              />
              <button type="button" className="wpf-action-button" onClick={() => void reload()} disabled={loading}>
                Refresh
              </button>
            </div>
            {error || !apiReady ? (
              <p className="si-list-toolbar__status" role="status">{error ?? 'API offline'}</p>
            ) : null}
          </div>
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
