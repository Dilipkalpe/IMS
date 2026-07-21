import { useCallback, useEffect, useMemo, useState } from 'react';
import { useListNewShortcut } from '../components/transaction/useListNewShortcut';
import { CorporateDataGrid, buildGridTemplateColumns, type DataGridColumn } from '../components/datagrid/CorporateDataGrid';
import { ListGridArea } from '../components/loading';
import { TransactionEntryShell } from '../components/transaction/TransactionEntryShell';
import { TransactionListColumnFilters } from '../components/transaction/TransactionListColumnFilters';
import {
  NUMBERED_SALES_SORTABLE_COLUMN_IDS,
  useNumberedSalesSortField,
} from '../components/transaction/numberedSalesListScreenHelpers';
import {
  SALES_LIST_COLUMN_FILTER_DEFS,
} from '../components/transaction/transactionListQuery';
import { TransactionListPagination } from '../components/transaction/TransactionListPagination';
import { SALES_MODULE_CONFIG } from '../components/transaction/salesModuleConfig';
import {
  createListActionColumn,
  useDocumentListDelete,
  useListRowSelection,
} from '../components/transaction/transactionListCrud';
import { useListExportActions } from '../components/transaction/useListExportActions';
import { useProtectedSalesListActions } from '../components/transaction/useProtectedSalesListActions';
import { useTransactionListLoader } from '../components/transaction/useTransactionListLoader';
import { StatusTabBar } from '../components/transaction/StatusTabBar';
import { buildSalesInvoiceStatusTabs } from '../components/transaction/salesStatusTabConfigs';
import { useListStats } from '../components/transaction/useListStats';
import { ListMoreMenu } from '../components/transaction/ListMoreMenu';
import { useAppNavigation } from '../context/AppNavigationContext';
import { mapSalesInvoiceToPrintableDocument } from '../document/mappers/salesInvoicePrintMapper';
import {
  loadSalesListRecord,
  useSalesListRowPrint,
} from '../components/transaction/useSalesListRowPrint';
import { FormKeyboardScope } from '../keyboard/FormKeyboardScope';
import { FIELD_FOCUS_KEY } from '../keyboard/formKeyboardNavigation';
import { RefinedScreenShell } from '../screens/RefinedScreenShell';
import { useSalesInvoiceNavIntent } from './context/SalesInvoiceNavIntent';
import { invalidateSalesInvoiceList } from './repository/listCache';
import { listRowsFromRecords } from './repository/localSalesInvoiceRepository';
import { recordToListRow, recordToUiSnapshot } from './repository/recordMappers';
import {
  useSalesInvoiceListVersion,
  useSalesInvoiceRepositoryOptional,
} from './repository/SalesInvoiceRepositoryContext';
import type { SalesInvoiceListRow } from './types';
import type { SalesInvoiceListStats, SalesInvoiceRecord } from './repository/types';
import './sales-invoice.scss';

export function SalesInvoiceListScreen() {
  const navigate = useAppNavigation();
  const { publishOpenIntent } = useSalesInvoiceNavIntent();
  const repoCtx = useSalesInvoiceRepositoryOptional();
  const repository = repoCtx?.repository;
  const listVersion = useSalesInvoiceListVersion();
  const [stats, setStats] = useState<SalesInvoiceListStats>({ total: 0, draft: 0, posted: 0 });
  const toSortField = useNumberedSalesSortField('invoiceDate');

  const mapRows = useCallback(
    (items: unknown[], mode: 'http' | 'local') =>
      mode === 'local'
        ? listRowsFromRecords(items as SalesInvoiceRecord[])
        : (items as SalesInvoiceRecord[]).map(recordToListRow),
    [],
  );

  const list = useTransactionListLoader({
    repository,
    listVersion,
    mapRows,
    toSortField,
    defaultSortColumn: 'date',
    defaultSortDir: 'desc',
    supportsColumnFilters: true,
    docLabelPlural: 'invoice(s)',
  });

  const onStats = useCallback((listStats: SalesInvoiceListStats) => {
    setStats(listStats);
  }, []);

  useListStats(repository, listVersion, onStats);

  const { selectedId, setSelectedId, selectedRow } = useListRowSelection(list.rows);

  const openWorkspaceRaw = useCallback(
    (row?: SalesInvoiceListRow) => {
      publishOpenIntent(row ? { type: 'edit', documentId: row.id } : { type: 'new' });
      navigate('sales-invoice-entry');
    },
    [navigate, publishOpenIntent],
  );

  const { canAdd, canEdit, canDelete, canExport, openWorkspace, authorizeDeleteRow } =
    useProtectedSalesListActions<SalesInvoiceListRow>(SALES_MODULE_CONFIG.salesInvoice, {
      onOpenNew: () => openWorkspaceRaw(),
      onOpenEdit: (row) => openWorkspaceRaw(row),
      setStatusMessage: list.setStatusMessage,
    });

  const printRow = useSalesListRowPrint<SalesInvoiceListRow, SalesInvoiceRecord>({
    repository,
    documentType: 'sales_invoice',
    recordToPrintable: (record) => mapSalesInvoiceToPrintableDocument(recordToUiSnapshot(record)),
    loadRecord: (row) => {
      if (!repository) return Promise.reject(new Error('Repository not ready.'));
      return loadSalesListRecord(repository, row, 'Sales invoice');
    },
    setStatusMessage: list.setStatusMessage,
  });

  const handleDelete = useDocumentListDelete<SalesInvoiceListRow>({
    repository,
    docLabel: 'sales invoice',
    invalidateList: invalidateSalesInvoiceList,
    reload: list.reload,
    setStatusMessage: list.setStatusMessage,
    authorizeDelete: authorizeDeleteRow,
  });

  const columns = useMemo((): DataGridColumn<SalesInvoiceListRow>[] => {
    return [
      createListActionColumn({
        onPrint: (row) => void printRow(row),
        onEdit: (row) => void openWorkspace(row),
        onDelete: (row) => void handleDelete(row),
        canEdit,
        canDelete,
      }),
      { id: 'billNo', header: 'Bill No', width: 120, readOnly: true, getValue: (r) => r.billNo },
      { id: 'date', header: 'Date', width: 100, readOnly: true, getValue: (r) => r.date },
      { id: 'customer', header: 'Customer', width: '*', minWidth: 180, readOnly: true, getValue: (r) => r.customer },
      { id: 'amount', header: 'Amount', width: 110, readOnly: true, getValue: (r) => r.amount },
      { id: 'status', header: 'Status', width: 90, readOnly: true, getValue: (r) => r.status },
    ];
  }, [canDelete, canEdit, handleDelete, openWorkspace, printRow]);

  const gridTemplate = useMemo(
    () => buildGridTemplateColumns(columns as DataGridColumn<unknown>[]),
    [columns],
  );

  const exportColumns = useMemo(
    () => columns.filter((c) => c.id !== 'actions').map((c) => ({ id: c.id, header: String(c.header) })),
    [columns],
  );

  const listExport = useListExportActions({
    title: 'Sales Invoice Register',
    documentType: 'sales_invoice',
    docLabelPlural: 'invoice(s)',
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

  const statusTabs = useMemo(() => buildSalesInvoiceStatusTabs(stats), [stats]);

  const handleStatusTabSelect = useCallback(
    (filterValue: string) => {
      list.setStatusFilter(filterValue);
    },
    [list],
  );

  return (
    <RefinedScreenShell className="sales-invoice-list-screen transaction-list-screen">
      <TransactionEntryShell title="Sales Invoice">
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
                defaultValue=""
                aria-label="Additional filters"
                disabled
              >
                <option value="">-- Filters --</option>
              </select>
              <input
                className="wpf-form-input si-list-toolbar__search"
                {...{ [FIELD_FOCUS_KEY]: 'list-search' }}
                placeholder="Enter Filter Value"
                value={list.searchInput}
                onChange={(e) => list.setSearchInput(e.target.value)}
                aria-label="Search invoices"
              />
              <button
                type="button"
                className="wpf-action-button si-list-toolbar__add-new"
                {...{ [FIELD_FOCUS_KEY]: 'list-new' }}
                title="New invoice (Ctrl+N)"
                onClick={() => void openWorkspace()}
                disabled={!canAdd}
              >
                + Add New
              </button>
              <button
                type="button"
                className="wpf-action-button"
                onClick={() => selectedRow && void openWorkspace(selectedRow)}
                disabled={!selectedRow || !canEdit}
              >
                Edit
              </button>
              <button
                type="button"
                className="wpf-action-button"
                onClick={() => selectedRow && void handleDelete(selectedRow)}
                disabled={!selectedRow || !canDelete}
              >
                Delete
              </button>
              <ListMoreMenu
                disabled={list.loading}
                exportBusy={listExport.exporting}
                exportDisabled={listExport.exportDisabled}
                canClearFilters={list.hasActiveFilters}
                onRefresh={() => void list.reload()}
                onClearFilters={list.clearFilters}
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
              sortableColumnIds={[...NUMBERED_SALES_SORTABLE_COLUMN_IDS]}
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
