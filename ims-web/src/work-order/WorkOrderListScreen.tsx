import { useCallback, useEffect, useMemo, useState } from 'react';
import { CorporateDataGrid, type DataGridColumn } from '../components/datagrid/CorporateDataGrid';
import { ListGridArea } from '../components/loading';
import { createListActionColumn } from '../components/transaction/transactionListCrud';
import { TransactionListPagination } from '../components/transaction/TransactionListPagination';
import { LIST_PAGE_SIZES } from '../components/transaction/transactionListQuery';
import { useListNewShortcut } from '../components/transaction/useListNewShortcut';
import { probeApiHealth } from '../api/client';
import {
  deleteProductionOrderByNo,
  fetchProductionOrderStats,
  fetchProductionOrdersPage,
  type ProductionOrderRecord,
  type ProductionOrderStats,
} from '../api/productionOrders';
import { useAppNavigation } from '../context/AppNavigationContext';
import { RefinedScreenShell } from '../screens/RefinedScreenShell';
import { TransactionEntryShell } from '../components/transaction/TransactionEntryShell';
import { useWorkOrderNavIntent } from './context/WorkOrderNavIntent';
import '../sales-invoice/sales-invoice.scss';
import './work-order.scss';

interface WorkOrderListRow {
  id: string;
  productionNo: string;
  item: string;
  qty: string;
  amount: string;
  status: string;
}

const GODOWNS = ['Counter', 'Main', 'Production'] as const;

function formatMoney(value?: number): string {
  const n = Number(value ?? 0);
  return n.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function recordToRow(order: ProductionOrderRecord): WorkOrderListRow {
  const qty =
    (order.finalQty ?? 0) > 0
      ? String(order.finalQty)
      : String(order.produceQty ?? 0);
  return {
    id: String(order.productionNo),
    productionNo: String(order.productionNo),
    item: order.manufacturingItemName?.trim() || order.manufacturingItemId || '—',
    qty,
    amount: formatMoney(order.productionAmount),
    status: order.status ?? '',
  };
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="wo-stat-card">
      <span className="wo-stat-card__label">{label}</span>
      <span className="wo-stat-card__value">{value}</span>
    </div>
  );
}

export function WorkOrderListScreen() {
  const navigate = useAppNavigation();
  const { publishOpenIntent } = useWorkOrderNavIntent();
  const [records, setRecords] = useState<ProductionOrderRecord[]>([]);
  const [stats, setStats] = useState<ProductionOrderStats | null>(null);
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

  const recordForRow = useCallback(
    (row: WorkOrderListRow) => records.find((r) => String(r.productionNo) === row.id) ?? null,
    [records],
  );

  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const apiUp = await probeApiHealth();
      setApiReady(apiUp);
      if (!apiUp) {
        setRecords([]);
        setTotal(0);
        setStats(null);
        setError('API is offline — cannot load work orders.');
        return;
      }

      const [listResult, statsResult] = await Promise.all([
        fetchProductionOrdersPage({ page, limit: pageSize, search }),
        fetchProductionOrderStats(),
      ]);
      setRecords(listResult.items ?? []);
      setTotal(listResult.total ?? 0);
      setStats(statsResult);
    } catch (err) {
      setRecords([]);
      setTotal(0);
      setStats(null);
      setError(err instanceof Error ? err.message : 'Failed to load work orders.');
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
    publishOpenIntent({ type: 'new', returnNavKey: 'production-orders' });
    navigate('work-order-entry');
  }, [navigate, publishOpenIntent]);

  const openEdit = useCallback(
    (record: ProductionOrderRecord) => {
      publishOpenIntent({
        type: 'edit',
        productionNo: record.productionNo,
        returnNavKey: 'production-orders',
      });
      navigate('work-order-entry');
    },
    [navigate, publishOpenIntent],
  );

  const handleDelete = useCallback(
    async (record: ProductionOrderRecord) => {
      const isCompleted =
        String(record.status ?? '').toLowerCase() === 'completed';
      const prompt = isCompleted
        ? `Job Work #${record.productionNo} is completed (stock was already posted).\n\nDelete this record?\n\nStock transfers are NOT reversed automatically.`
        : `Delete Job Work #${record.productionNo}?`;
      if (!window.confirm(prompt)) return;

      try {
        await deleteProductionOrderByNo(record.productionNo);
        setSelectedId(null);
        await reload();
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Delete failed.');
      }
    },
    [reload],
  );

  const columns = useMemo<DataGridColumn<WorkOrderListRow>[]>(
    () => [
      createListActionColumn({
        rowLabel: (row) => row.productionNo,
        onEdit: (row) => {
          const rec = recordForRow(row);
          if (rec) openEdit(rec);
        },
        onDelete: (row) => {
          const rec = recordForRow(row);
          if (rec) void handleDelete(rec);
        },
      }),
      { id: 'productionNo', header: 'Job No', width: 90 },
      { id: 'item', header: 'Manufacturing Item', minWidth: 160 },
      { id: 'qty', header: 'Final Qty', width: 90 },
      { id: 'amount', header: 'Amount', width: 110 },
      { id: 'status', header: 'Status', width: 110 },
    ],
    [handleDelete, openEdit, recordForRow],
  );

  useListNewShortcut(true, openNew);

  const statCards = useMemo(() => {
    const open = stats?.open ?? records.filter((r) => r.status === 'Open').length;
    const scheduled = records.filter((r) => String(r.status).toLowerCase() === 'open').length;
    const inProgress =
      stats?.inProgress ??
      records.filter((r) => String(r.status).toLowerCase() === 'in progress').length;
    const completedWeek =
      stats?.completedWeek ??
      records.filter((r) => String(r.status).toLowerCase() === 'completed').length;
    return [
      { label: 'Open', value: String(open) },
      { label: 'Scheduled', value: String(scheduled) },
      { label: 'In Progress', value: String(inProgress) },
      { label: 'Completed (Week)', value: String(completedWeek) },
    ];
  }, [records, stats]);

  return (
    <RefinedScreenShell className="work-order-list-screen">
      <TransactionEntryShell title="Work Orders">
        <div className="si-list-layout fv-list">
          <p className="wo-list-desc">
            Job work entries — materials from BOM, stage tracking, stock issue and finished goods receipt.
          </p>

          <div className="wo-stat-row">
            {statCards.map((card) => (
              <StatCard key={card.label} label={card.label} value={card.value} />
            ))}
          </div>

          <div className="si-list-toolbar">
            <div className="fv-list__toolbar si-list-toolbar__row">
              <button
                type="button"
                className="wpf-primary-button wo-list-add-btn"
                onClick={openNew}
                title="Create new job work entry (Ctrl+N)"
              >
                <span className="wpf-icontext" aria-hidden="true">
                  &#xE710;
                </span>
                Add Job Work
              </button>
              <input
                className="wpf-form-input si-list-toolbar__search"
                placeholder="Search job no, item, machine…"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
              />
              <button type="button" className="wpf-action-button" onClick={() => void reload()} disabled={loading}>
                Refresh
              </button>
            </div>
            {(error || !apiReady) ? (
              <p className="si-list-toolbar__status" role="status">
                {error ?? 'API offline'}
              </p>
            ) : null}
          </div>

          <ListGridArea loading={loading} className="fv-list__grid-wrap">
            <CorporateDataGrid
              columns={columns}
              data={rows}
              variant="so-list"
              rowHeight={42}
              headerHeight={44}
              minHeight={280}
              selectedRowId={selectedId}
              onRowClick={(row) => setSelectedId(row.id)}
              onRowDoubleClick={(row) => {
                const rec = recordForRow(row);
                if (rec) openEdit(rec);
              }}
            />
          </ListGridArea>

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

export { GODOWNS, formatMoney };
