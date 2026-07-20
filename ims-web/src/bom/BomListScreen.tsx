import { useCallback, useEffect, useMemo, useState } from 'react';
import { fetchBomsPage, type BomRecord } from '../api/boms';
import { probeApiHealth } from '../api/client';
import { CorporateDataGrid, type DataGridColumn } from '../components/datagrid/CorporateDataGrid';
import { ListGridArea } from '../components/loading';
import { createListActionColumn } from '../components/transaction/transactionListCrud';
import { TransactionListPagination } from '../components/transaction/TransactionListPagination';
import { LIST_PAGE_SIZES } from '../components/transaction/transactionListQuery';
import { useListNewShortcut } from '../components/transaction/useListNewShortcut';
import { useAppNavigation } from '../context/AppNavigationContext';
import { RefinedScreenShell } from '../screens/RefinedScreenShell';
import { TransactionEntryShell } from '../components/transaction/TransactionEntryShell';
import { useCanManageBom } from '../auth/useCanManageBom';
import { useBomNavIntent } from './context/BomNavIntent';
import '../sales-invoice/sales-invoice.scss';

interface BomListRow {
  id: string;
  productCode: string;
  productName: string;
  revision: string;
  amount: string;
  status: string;
}

function formatMoney(value?: number): string {
  const n = Number(value ?? 0);
  return n.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function recordToRow(bom: BomRecord): BomListRow {
  return {
    id: bom.productCode,
    productCode: bom.productCode,
    productName: bom.productName ?? '',
    revision: bom.revision ?? '',
    amount: formatMoney(bom.productionAmount),
    status: bom.status ?? '',
  };
}

export function BomListScreen() {
  const navigate = useAppNavigation();
  const { publishOpenIntent } = useBomNavIntent();
  const canManage = useCanManageBom();
  const [records, setRecords] = useState<BomRecord[]>([]);
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
    (row: BomListRow) => records.find((r) => r.productCode === row.id) ?? null,
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
        setError('API is offline — cannot load BOMs.');
        return;
      }
      const result = await fetchBomsPage({ page, limit: pageSize, search });
      setRecords(result.items ?? []);
      setTotal(result.total ?? 0);
    } catch (err) {
      setRecords([]);
      setTotal(0);
      setError(err instanceof Error ? err.message : 'Failed to load BOMs.');
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

  useEffect(() => {
    const initial = sessionStorage.getItem('ims.masterList.initialSearch.bom')?.trim();
    if (!initial) return;
    sessionStorage.removeItem('ims.masterList.initialSearch.bom');
    setSearchInput(initial);
    setSearch(initial);
  }, []);

  const openNew = useCallback(() => {
    if (!canManage) return;
    publishOpenIntent({ type: 'new', returnNavKey: 'bom' });
    navigate('bom-entry');
  }, [canManage, navigate, publishOpenIntent]);

  const openEdit = useCallback(
    (record: BomRecord) => {
      if (!canManage) return;
      publishOpenIntent({ type: 'edit', productCode: record.productCode, returnNavKey: 'bom' });
      navigate('bom-entry');
    },
    [canManage, navigate, publishOpenIntent],
  );

  const columns = useMemo<DataGridColumn<BomListRow>[]>(
    () => [
      ...(canManage
        ? [
            createListActionColumn({
              rowLabel: (row) => row.productCode,
              onEdit: (row) => {
                const rec = recordForRow(row);
                if (rec) openEdit(rec);
              },
              onDelete: () => {},
              canEdit: true,
              canDelete: false,
            }),
          ]
        : []),
      { id: 'productCode', header: 'Product', width: 120, readOnly: true, getValue: (r) => r.productCode },
      { id: 'productName', header: 'Name', minWidth: 180, readOnly: true, getValue: (r) => r.productName },
      { id: 'revision', header: 'Revision', width: 90, readOnly: true, getValue: (r) => r.revision },
      { id: 'amount', header: 'Amount', width: 110, readOnly: true, getValue: (r) => r.amount },
      { id: 'status', header: 'Status', width: 90, readOnly: true, getValue: (r) => r.status },
    ],
    [canManage, openEdit, recordForRow],
  );

  useListNewShortcut(canManage, openNew);

  return (
    <RefinedScreenShell className="sales-invoice-list-screen">
      <TransactionEntryShell title="Bill of Materials">
        <div className="si-list-layout fv-list">
          <div className="si-list-toolbar">
            <div className="fv-list__toolbar si-list-toolbar__row">
              {canManage ? (
                <button type="button" className="wpf-action-button" onClick={openNew} title="Ctrl+N">
                  <span className="wpf-icontext" aria-hidden="true">&#xE710;</span> New BOM
                </button>
              ) : null}
              <input
                className="wpf-form-input si-list-toolbar__search"
                placeholder="Search product code, name…"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
              />
              <button type="button" className="wpf-action-button" onClick={() => void reload()} disabled={loading}>
                Refresh
              </button>
            </div>
            {error || !apiReady ? (
              <p className="si-list-toolbar__status" role="status">
                {error ?? 'API offline'}
              </p>
            ) : null}
          </div>
          <ListGridArea loading={loading} empty={rows.length === 0 && !loading}>
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
