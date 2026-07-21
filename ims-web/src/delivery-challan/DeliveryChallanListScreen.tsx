import { useCallback, useEffect, useMemo } from 'react';
import { CorporateDataGrid, buildGridTemplateColumns, type DataGridColumn } from '../components/datagrid/CorporateDataGrid';
import { ListGridArea } from '../components/loading';
import { TransactionEntryShell } from '../components/transaction/TransactionEntryShell';
import { useNumberedSalesSortField } from '../components/transaction/numberedSalesListScreenHelpers';
import { TransactionListPagination } from '../components/transaction/TransactionListPagination';
import { SALES_MODULE_CONFIG } from '../components/transaction/salesModuleConfig';
import {
  createListActionColumn,
  useDocumentListDelete,
  useListRowSelection,
} from '../components/transaction/transactionListCrud';
import { ListExportMenu } from '../components/transaction/ListExportMenu';
import { useListExportActions } from '../components/transaction/useListExportActions';
import { useListNewShortcut } from '../components/transaction/useListNewShortcut';
import { useProtectedSalesListActions } from '../components/transaction/useProtectedSalesListActions';
import { useTransactionListLoader } from '../components/transaction/useTransactionListLoader';
import { useAppNavigation } from '../context/AppNavigationContext';
import { mapDeliveryChallanToPrintableDocument } from '../document/mappers/deliveryChallanPrintMapper';
import {
  loadSalesListRecord,
  useSalesListRowPrint,
} from '../components/transaction/useSalesListRowPrint';
import { FormKeyboardScope } from '../keyboard/FormKeyboardScope';
import { FIELD_FOCUS_KEY } from '../keyboard/formKeyboardNavigation';
import { RefinedScreenShell } from '../screens/RefinedScreenShell';
import '../sales-invoice/sales-invoice.scss';
import { useDeliveryChallanNavIntent } from './context/DeliveryChallanNavIntent';
import { invalidateDeliveryChallanList } from './repository/listCache';
import { listRowsFromRecords } from './repository/localDeliveryChallanRepository';
import { recordToListRow, recordToUiSnapshot } from './repository/recordMappers';
import { useDeliveryChallanListVersion, useDeliveryChallanRepositoryOptional } from './repository/DeliveryChallanRepositoryContext';
import type { DeliveryChallanListRow } from './types';
import type { DeliveryChallanRecord } from './repository/types';

const DC_SORTABLE_IDS = ['billNo', 'date', 'customer', 'amount', 'status'];

export function DeliveryChallanListScreen() {
  const navigate = useAppNavigation();
  const { publishOpenIntent } = useDeliveryChallanNavIntent();
  const repoCtx = useDeliveryChallanRepositoryOptional();
  const repository = repoCtx?.repository;
  const listVersion = useDeliveryChallanListVersion();
  const toSortField = useNumberedSalesSortField('dcDate');

  const mapRows = useCallback(
    (items: unknown[], mode: 'http' | 'local') =>
      mode === 'local'
        ? listRowsFromRecords(items as DeliveryChallanRecord[])
        : (items as DeliveryChallanRecord[]).map(recordToListRow),
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
    docLabelPlural: 'delivery challan(s)',
  });

  const { selectedId, setSelectedId, selectedRow } = useListRowSelection(list.rows);

  const openWorkspaceRaw = useCallback(
    (row?: DeliveryChallanListRow) => {
      publishOpenIntent(row ? { type: 'edit', documentId: row.id } : { type: 'new' });
      navigate('delivery-challan-entry');
    },
    [navigate, publishOpenIntent],
  );

  const { canAdd, canEdit, canDelete, canExport, openWorkspace, authorizeDeleteRow } =
    useProtectedSalesListActions<DeliveryChallanListRow>(SALES_MODULE_CONFIG.deliveryChallan, {
      onOpenNew: () => openWorkspaceRaw(),
      onOpenEdit: (row) => openWorkspaceRaw(row),
      setStatusMessage: list.setStatusMessage,
    });

  const printRow = useSalesListRowPrint<DeliveryChallanListRow, DeliveryChallanRecord>({
    repository,
    documentType: 'delivery_challan',
    recordToPrintable: (record) => mapDeliveryChallanToPrintableDocument(recordToUiSnapshot(record)),
    loadRecord: (row) => {
      if (!repository) return Promise.reject(new Error('Repository not ready.'));
      return loadSalesListRecord(repository, row, 'Delivery challan');
    },
    setStatusMessage: list.setStatusMessage,
  });

  const handleDelete = useDocumentListDelete<DeliveryChallanListRow>({
    repository,
    docLabel: 'delivery challan',
    invalidateList: invalidateDeliveryChallanList,
    reload: list.reload,
    setStatusMessage: list.setStatusMessage,
    authorizeDelete: authorizeDeleteRow,
  });

  const columns = useMemo((): DataGridColumn<DeliveryChallanListRow>[] => {
    return [
      createListActionColumn({
        onPrint: (row) => void printRow(row),
        onEdit: (row) => void openWorkspace(row),
        onDelete: (row) => void handleDelete(row),
        canEdit,
        canDelete,
      }),
      { id: 'billNo', header: 'DC No', width: 110, readOnly: true, getValue: (r) => r.billNo },
      { id: 'date', header: 'Date', width: 100, readOnly: true, getValue: (r) => r.date },
      { id: 'customer', header: 'Customer', width: '*', minWidth: 160, readOnly: true, getValue: (r) => r.customer },
      { id: 'soReference', header: 'SO Ref', width: 100, readOnly: true, getValue: (r) => r.soReference },
      { id: 'amount', header: 'Amount', width: 100, readOnly: true, getValue: (r) => r.amount },
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
    title: 'Delivery Challan Register',
    documentType: 'delivery_challan',
    docLabelPlural: 'delivery challan(s)',
    canExport,
    columns: exportColumns,
    rowToRecord: (r) => ({
      billNo: r.billNo,
      date: r.date,
      customer: r.customer,
      soReference: r.soReference,
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

  return (
    <RefinedScreenShell className="sales-invoice-list-screen">
      <TransactionEntryShell title="Delivery Challan">
        <FormKeyboardScope className="si-list-layout" autoFocusFieldKey="list-search">
          <div className="si-list-toolbar">
            <div className="si-list-toolbar__row">
              <button
                type="button"
                className="wpf-action-button"
                {...{ [FIELD_FOCUS_KEY]: 'list-new' }}
                onClick={() => void openWorkspace()}
                disabled={!canAdd}
              >
                New
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
              <input
                className="wpf-form-input si-list-toolbar__search"
                {...{ [FIELD_FOCUS_KEY]: 'list-search' }}
                placeholder="Search DC no, customer, SO…"
                value={list.searchInput}
                onChange={(e) => list.setSearchInput(e.target.value)}
              />
              <select className="wpf-form-combo si-list-toolbar__filter" value={list.statusFilter} onChange={(e) => list.setStatusFilter(e.target.value)}>
                {['All', 'Open', 'Draft', 'Posted'].map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
              <button type="button" className="wpf-action-button" onClick={() => void list.reload()} disabled={list.loading}>
                Refresh
              </button>
              <button type="button" className="wpf-action-button" onClick={list.clearFilters} disabled={!list.hasActiveFilters}>
                Clear filters
              </button>
              <ListExportMenu
                disabled={listExport.exportDisabled}
                busy={listExport.exporting}
                onExport={(format) => void listExport.runExport(format)}
              />
            </div>
            {list.statusMessage ? (
              <p className="si-list-toolbar__status" role="status">{list.statusMessage}</p>
            ) : null}
          </div>
          <ListGridArea loading={list.loading}>
            <div className="si-list-column-filters" style={{ gridTemplateColumns: gridTemplate }}>
              <div className="si-list-column-filters__spacer" aria-hidden />
              <input
                type="search"
                className="wpf-sales-compact-input si-list-column-filters__input"
                placeholder="Filter DC no…"
                value={list.columnFilters.billNo}
                disabled={list.loading}
                onChange={(e) => list.setColumnFilter('billNo', e.target.value)}
              />
              <input
                type="search"
                className="wpf-sales-compact-input si-list-column-filters__input"
                placeholder="Filter date…"
                value={list.columnFilters.date}
                disabled={list.loading}
                onChange={(e) => list.setColumnFilter('date', e.target.value)}
              />
              <input
                type="search"
                className="wpf-sales-compact-input si-list-column-filters__input"
                placeholder="Filter customer…"
                value={list.columnFilters.customer}
                disabled={list.loading}
                onChange={(e) => list.setColumnFilter('customer', e.target.value)}
              />
              <span />
              <input
                type="search"
                className="wpf-sales-compact-input si-list-column-filters__input"
                placeholder="Filter amount…"
                value={list.columnFilters.amount}
                disabled={list.loading}
                onChange={(e) => list.setColumnFilter('amount', e.target.value)}
              />
              <input
                type="search"
                className="wpf-sales-compact-input si-list-column-filters__input"
                placeholder="Filter status…"
                value={list.columnFilters.status}
                disabled={list.loading}
                onChange={(e) => list.setColumnFilter('status', e.target.value)}
              />
            </div>
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
              sortableColumnIds={DC_SORTABLE_IDS}
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
