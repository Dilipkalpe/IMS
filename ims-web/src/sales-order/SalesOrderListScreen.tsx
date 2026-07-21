import { useCallback, useEffect, useMemo, useState } from 'react';
import { CorporateDataGrid, buildGridTemplateColumns, type DataGridColumn } from '../components/datagrid/CorporateDataGrid';
import { ListGridArea } from '../components/loading';
import { TransactionEntryShell } from '../components/transaction/TransactionEntryShell';
import { TransactionListColumnFilters } from '../components/transaction/TransactionListColumnFilters';
import {
  SALES_LIST_COLUMN_FILTER_DEFS,
  salesOrderSortField,
} from '../components/transaction/transactionListQuery';
import { useListNewShortcut } from '../components/transaction/useListNewShortcut';
import { TransactionListPagination } from '../components/transaction/TransactionListPagination';
import { SALES_MODULE_CONFIG } from '../components/transaction/salesModuleConfig';
import { createListActionColumn, useListRowSelection } from '../components/transaction/transactionListCrud';
import { useListExportActions } from '../components/transaction/useListExportActions';
import { useProtectedSalesListActions } from '../components/transaction/useProtectedSalesListActions';
import { useTransactionListLoader } from '../components/transaction/useTransactionListLoader';
import { StatusTabBar } from '../components/transaction/StatusTabBar';
import {
  buildSalesOrderStatusTabs,
  SALES_ORDER_EXTRA_STATUS_FILTERS,
} from '../components/transaction/salesStatusTabConfigs';
import { useListStats } from '../components/transaction/useListStats';
import { ListMoreMenu } from '../components/transaction/ListMoreMenu';
import { useAppNavigation } from '../context/AppNavigationContext';
import { FormKeyboardScope } from '../keyboard/FormKeyboardScope';
import { FIELD_FOCUS_KEY } from '../keyboard/formKeyboardNavigation';
import { RefinedScreenShell } from '../screens/RefinedScreenShell';
import '../sales-invoice/sales-invoice.scss';
import { useSalesOrderNavIntent } from './context/SalesOrderNavIntent';
import { invalidateSalesOrderList } from './repository/listCache';
import { listRowsFromRecords } from './repository/localSalesOrderRepository';
import type { SalesOrderListSummary } from '../api/salesOrders';
import { mapSalesOrderToPrintableDocument } from '../document/mappers/salesOrderPrintMapper';
import {
  loadSalesListRecord,
  useSalesListRowPrint,
} from '../components/transaction/useSalesListRowPrint';
import { listSummaryToListRow, recordToUiSnapshot } from './repository/recordMappers';
import {
  useSalesOrderListVersion,
  useSalesOrderRepositoryOptional,
} from './repository/SalesOrderRepositoryContext';
import { parseFormattedSoNo } from './soDocumentNo';
import type { SalesOrderListStats } from './repository/types';
import type { SalesOrderListRow } from './types';
import type { SalesOrderRecord } from './repository/types';

const SORTABLE_COLUMN_IDS = ['billNo', 'date', 'customer', 'amount', 'status'];

export function SalesOrderListScreen() {
  const navigate = useAppNavigation();
  const { publishOpenIntent } = useSalesOrderNavIntent();
  const repoCtx = useSalesOrderRepositoryOptional();
  const repository = repoCtx?.repository;
  const listVersion = useSalesOrderListVersion();
  const [stats, setStats] = useState<SalesOrderListStats>({
    total: 0,
    draft: 0,
    open: 0,
    confirmed: 0,
    picking: 0,
    shipped: 0,
    cancelled: 0,
  });
  const [extraStatusFilter, setExtraStatusFilter] = useState('');

  const mapRows = useCallback(
    (items: unknown[], mode: 'http' | 'local') =>
      mode === 'local'
        ? listRowsFromRecords(items as SalesOrderRecord[])
        : (items as SalesOrderListSummary[]).map(listSummaryToListRow),
    [],
  );

  const list = useTransactionListLoader({
    repository,
    listVersion,
    mapRows,
    toSortField: salesOrderSortField,
    defaultSortColumn: 'billNo',
    defaultSortDir: 'desc',
    docLabelPlural: 'sales order(s)',
    supportsColumnFilters: true,
  });

  const onStats = useCallback((listStats: SalesOrderListStats) => {
    setStats(listStats);
  }, []);

  useListStats(repository, listVersion, onStats);

  const { selectedId, setSelectedId, selectedRow } = useListRowSelection(list.rows);

  const openWorkspaceRaw = useCallback(
    (row?: SalesOrderListRow) => {
      publishOpenIntent(row ? { type: 'edit', documentId: row.id } : { type: 'new' });
      navigate('sales-order-entry');
    },
    [navigate, publishOpenIntent],
  );

  const { canAdd, canEdit, canDelete, canExport, openWorkspace, authorizeDeleteRow } =
    useProtectedSalesListActions<SalesOrderListRow>(SALES_MODULE_CONFIG.salesOrder, {
      onOpenNew: () => openWorkspaceRaw(),
      onOpenEdit: (row) => openWorkspaceRaw(row),
      setStatusMessage: list.setStatusMessage,
    });

  const printRow = useSalesListRowPrint<SalesOrderListRow, SalesOrderRecord>({
    repository,
    documentType: 'sales_order',
    recordToPrintable: (record) => mapSalesOrderToPrintableDocument(recordToUiSnapshot(record)),
    loadRecord: async (row) => {
      if (!repository) throw new Error('Repository not ready.');
      if (row.billNo?.trim() && parseFormattedSoNo(row.billNo)) {
        try {
          return await repository.loadByFormatted(row.billNo.trim());
        } catch {
          /* fall through */
        }
      }
      return loadSalesListRecord(repository, row, 'Sales order');
    },
    setStatusMessage: list.setStatusMessage,
  });

  const deleteRow = useCallback(
    async (row: SalesOrderListRow) => {
      if (!repository) return;
      const allowed = await authorizeDeleteRow(row);
      if (!allowed) return;
      try {
        if (repository.deleteByBillNo && parseFormattedSoNo(row.billNo)) {
          await repository.deleteByBillNo(row.billNo);
        } else {
          await repository.deleteById(row.id);
        }
        invalidateSalesOrderList();
        await list.reload();
        list.setStatusMessage(`Deleted ${row.billNo}.`);
      } catch (err) {
        list.setStatusMessage(err instanceof Error ? err.message : 'Delete failed.');
      }
    },
    [authorizeDeleteRow, list, repository],
  );

  const columns = useMemo((): DataGridColumn<SalesOrderListRow>[] => {
    return [
      createListActionColumn({
        onPrint: (row) => void printRow(row),
        onEdit: (row) => void openWorkspace(row),
        onDelete: (row) => void deleteRow(row),
        canEdit,
        canDelete,
      }),
      { id: 'billNo', header: 'Order No', width: 120, readOnly: true, getValue: (r) => r.billNo },
      { id: 'date', header: 'Date', width: 100, readOnly: true, getValue: (r) => r.date },
      { id: 'customer', header: 'Customer', width: '*', minWidth: 180, readOnly: true, getValue: (r) => r.customer },
      { id: 'amount', header: 'Amount', width: 110, readOnly: true, getValue: (r) => r.amount },
      { id: 'status', header: 'Status', width: 90, readOnly: true, getValue: (r) => r.status },
    ];
  }, [canDelete, canEdit, deleteRow, openWorkspace, printRow]);

  const gridTemplate = useMemo(
    () => buildGridTemplateColumns(columns as DataGridColumn<unknown>[]),
    [columns],
  );

  const exportColumns = useMemo(
    () => columns.filter((c) => c.id !== 'actions').map((c) => ({ id: c.id, header: String(c.header) })),
    [columns],
  );

  const listExport = useListExportActions({
    title: 'Sales Order Register',
    documentType: 'sales_order',
    docLabelPlural: 'sales order(s)',
    canExport,
    columns: exportColumns,
    rowToRecord: (r) => ({
      billNo: r.billNo,
      date: r.date,
      customer: r.customer,
      amount: r.amount,
      status: r.status,
    }),
    rows: list.rows,
    total: list.total,
    loading: list.loading,
    repository,
    mapRows,
    getExportQuery: list.getExportQuery,
    setStatusMessage: list.setStatusMessage,
  });

  useListNewShortcut(canAdd, () => void openWorkspace());

  const statusTabs = useMemo(() => buildSalesOrderStatusTabs(stats), [stats]);

  const handleStatusTabSelect = useCallback(
    (filterValue: string) => {
      setExtraStatusFilter('');
      list.setStatusFilter(filterValue);
    },
    [list],
  );

  const handleExtraStatusChange = useCallback(
    (value: string) => {
      setExtraStatusFilter(value);
      if (value) list.setStatusFilter(value);
    },
    [list],
  );

  const handleClearFilters = useCallback(() => {
    setExtraStatusFilter('');
    list.clearFilters();
  }, [list]);

  return (
    <RefinedScreenShell className="sales-invoice-list-screen transaction-list-screen">
      <TransactionEntryShell title="Sales Orders">
        <FormKeyboardScope className="si-list-layout" autoFocusFieldKey="list-search">
          <StatusTabBar
            tabs={statusTabs}
            activeFilter={list.statusFilter}
            onTabSelect={handleStatusTabSelect}
          />
          <div className="si-list-toolbar">
            <div className="si-list-toolbar__row">
              <select
                className="wpf-form-combo si-list-toolbar__filter-pick"
                value={extraStatusFilter}
                onChange={(e) => handleExtraStatusChange(e.target.value)}
                aria-label="Additional filters"
              >
                <option value="">-- Filters --</option>
                {SALES_ORDER_EXTRA_STATUS_FILTERS.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
              <input
                className="wpf-form-input si-list-toolbar__search"
                {...{ [FIELD_FOCUS_KEY]: 'list-search' }}
                placeholder="Enter Filter Value"
                value={list.searchInput}
                onChange={(e) => list.setSearchInput(e.target.value)}
              />
              <button
                type="button"
                className="wpf-action-button si-list-toolbar__add-new"
                {...{ [FIELD_FOCUS_KEY]: 'list-new' }}
                title="New order (Ctrl+N)"
                onClick={() => void openWorkspace()}
                disabled={!canAdd}
              >
                + Add New
              </button>
              <ListMoreMenu
                disabled={list.loading}
                exportBusy={listExport.exporting}
                exportDisabled={listExport.exportDisabled}
                canClearFilters={list.hasActiveFilters}
                onRefresh={() => void list.reload()}
                onClearFilters={handleClearFilters}
                onExport={(format) => void listExport.runExport(format)}
              />
            </div>
            {list.statusMessage ? (
              <p className="si-list-toolbar__status" role="status">{list.statusMessage}</p>
            ) : null}
          </div>
          <ListGridArea loading={list.loading}>
            <TransactionListColumnFilters
              columns={SALES_LIST_COLUMN_FILTER_DEFS}
              values={list.columnFilters}
              gridTemplate={gridTemplate}
              disabled={list.loading}
              onChange={list.setColumnFilter}
            />
            <CorporateDataGrid
              columns={columns}
              data={list.rows}
              minHeight={360}
              rowHeight={42}
              headerHeight={44}
              variant="so-list"
              virtualize={list.pageSize > 50}
              selectedRowId={selectedId}
              sortColumnId={list.sortColumn}
              sortDir={list.sortDir}
              sortableColumnIds={SORTABLE_COLUMN_IDS}
              onSortColumn={list.handleSortColumn}
              onRowClick={(row) => setSelectedId(row.id)}
              onRowDoubleClick={(row) => void openWorkspace(row)}
            />
            <TransactionListPagination
              page={list.page}
              pageSize={list.pageSize}
              totalPages={list.totalPages}
              totalRecords={list.total}
              loading={list.loading}
              onPageChange={list.setPage}
              onPageSizeChange={list.setPageSize}
            />
          </ListGridArea>
        </FormKeyboardScope>
      </TransactionEntryShell>
    </RefinedScreenShell>
  );
}
