import { useCallback, useEffect, useMemo, useState } from 'react';
import { CorporateDataGrid, type DataGridColumn } from '../components/datagrid/CorporateDataGrid';
import { LoadingHost } from '../components/loading';
import { TransactionListPagination } from '../components/transaction/TransactionListPagination';
import { LIST_PAGE_SIZES } from '../components/transaction/transactionListQuery';
import { useListNewShortcut } from '../components/transaction/useListNewShortcut';
import { probeApiHealth } from '../api/client';
import { fetchVoucherList, type VoucherRecord } from '../api/financeVouchers';
import { useAppNavigation } from '../context/AppNavigationContext';
import { usePaymentVoucherNavIntent } from '../payment-voucher/context/PaymentVoucherNavIntent';
import { RefinedScreenShell } from '../screens/RefinedScreenShell';
import { TransactionEntryShell } from '../components/transaction/TransactionEntryShell';
import '../sales-invoice/sales-invoice.scss';
import './finance-voucher.scss';
import type { VoucherModuleConfig } from './voucherConfigs';

interface VoucherListRow {
  id: string;
  voucherNo: number;
  refNo: string;
  date: string;
  account: string;
  cashBank: string;
  amount: string;
  narration: string;
  status: string;
}

function formatDate(iso?: string): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString('en-IN');
}

function recordToRow(r: VoucherRecord): VoucherListRow {
  return {
    id: String(r.voucherNo),
    voucherNo: r.voucherNo,
    refNo: r.refNo ?? '',
    date: formatDate(r.voucherDate),
    account: r.accountName || r.accountCode || '',
    cashBank: r.cashBank ?? '',
    amount: (r.amount ?? 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
    narration: r.narration ?? '',
    status: r.status ?? '',
  };
}

export function VoucherListScreen({ config }: { config: VoucherModuleConfig }) {
  const navigate = useAppNavigation();
  const { publishOpenIntent } = usePaymentVoucherNavIntent();
  const [rows, setRows] = useState<VoucherListRow[]>([]);
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

  const columns = useMemo<DataGridColumn<VoucherListRow>[]>(
    () => [
      { id: 'voucherNo', header: 'Voucher No', width: 110 },
      { id: 'refNo', header: 'Ref. No', width: 120 },
      { id: 'date', header: 'Date', width: 110 },
      { id: 'account', header: 'Account', minWidth: 160 },
      { id: 'cashBank', header: 'Cash/Bank', width: 100 },
      { id: 'amount', header: 'Amount', width: 120 },
      { id: 'status', header: 'Status', width: 90 },
      { id: 'narration', header: 'Narration', minWidth: 140 },
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
        setError('API is offline — cannot load vouchers.');
        return;
      }
      const result = await fetchVoucherList(config.apiPath, { page, limit: pageSize, search });
      setRows((result.items ?? []).map(recordToRow));
      setTotal(result.total ?? 0);
    } catch (err) {
      setRows([]);
      setTotal(0);
      setError(err instanceof Error ? err.message : 'Failed to load vouchers.');
    } finally {
      setLoading(false);
    }
  }, [config.apiPath, page, pageSize, search]);

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
    navigate(config.entryNavKey);
  }, [config.entryNavKey, navigate]);

  const openAllocation = useCallback(() => {
    if (!config.allocationNavKey) return;
    publishOpenIntent({ type: 'allocation', returnNavKey: config.listNavKey });
    navigate(config.allocationNavKey);
  }, [config.allocationNavKey, config.listNavKey, navigate, publishOpenIntent]);

  const openSelectedAllocation = useCallback(
    (voucherNo: number) => {
      if (!config.allocationNavKey) return;
      publishOpenIntent({
        type: 'allocation',
        voucherNo,
        returnNavKey: config.listNavKey,
      });
      navigate(config.allocationNavKey);
    },
    [config.allocationNavKey, config.listNavKey, navigate, publishOpenIntent],
  );

  useListNewShortcut(true, openNew);

  return (
    <RefinedScreenShell>
      <TransactionEntryShell title={config.title}>
        <div className="fv-list">
          <div className="fv-list__toolbar si-list-toolbar__row">
            <button type="button" className="wpf-action-button" onClick={openNew} title="Ctrl+N">
              {config.newButtonLabel}
            </button>
            {config.allocationNavKey && (
              <button type="button" className="wpf-action-button" onClick={openAllocation}>
                Multi-invoice payment
              </button>
            )}
            <input
              className="wpf-form-input si-list-toolbar__search"
              placeholder="Search voucher no, account…"
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
              onRowDoubleClick={(row) => {
                if (config.allocationNavKey) {
                  openSelectedAllocation(row.voucherNo);
                } else {
                  openNew();
                }
              }}
              emptyMessage="No vouchers found."
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
