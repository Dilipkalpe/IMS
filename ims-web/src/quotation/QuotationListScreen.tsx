import { useCallback, useMemo } from 'react';
import { CorporateDataGrid, buildGridTemplateColumns, type DataGridColumn } from '../components/datagrid/CorporateDataGrid';
import { ListGridArea } from '../components/loading';
import { TransactionEntryShell } from '../components/transaction/TransactionEntryShell';
import { TransactionListColumnFilters } from '../components/transaction/TransactionListColumnFilters';
import {
  SALES_LIST_COLUMN_FILTER_DEFS,
  quotationSortField,
} from '../components/transaction/transactionListQuery';
import { useListNewShortcut } from '../components/transaction/useListNewShortcut';
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
import { ListMoreMenu } from '../components/transaction/ListMoreMenu';
import { useAppNavigation } from '../context/AppNavigationContext';
import { mapQuotationToPrintableDocument } from '../document/mappers/quotationPrintMapper';
import {
  loadSalesListRecord,
  useSalesListRowPrint,
} from '../components/transaction/useSalesListRowPrint';
import { FormKeyboardScope } from '../keyboard/FormKeyboardScope';
import { FIELD_FOCUS_KEY } from '../keyboard/formKeyboardNavigation';
import { RefinedScreenShell } from '../screens/RefinedScreenShell';
import '../sales-invoice/sales-invoice.scss';
import { useQuotationNavIntent } from './context/QuotationNavIntent';
import { invalidateQuotationList } from './repository/listCache';
import { listRowsFromRecords } from './repository/localQuotationRepository';
import { recordToListRow, recordToUiSnapshot } from './repository/recordMappers';
import {
  useQuotationListVersion,
  useQuotationRepositoryOptional,
} from './repository/QuotationRepositoryContext';
import type { QuotationListRow } from './types';
import type { QuotationRecord } from './repository/types';

const SORTABLE_COLUMN_IDS = ['billNo', 'date', 'customer', 'amount', 'status'];

export function QuotationListScreen() {
  const navigate = useAppNavigation();
  const { publishOpenIntent } = useQuotationNavIntent();
  const repoCtx = useQuotationRepositoryOptional();
  const repository = repoCtx?.repository;
  const listVersion = useQuotationListVersion();

  const mapRows = useCallback(
    (items: unknown[], mode: 'http' | 'local') =>
      mode === 'local'
        ? listRowsFromRecords(items as QuotationRecord[])
        : (items as QuotationRecord[]).map(recordToListRow),
    [],
  );

  const list = useTransactionListLoader({
    repository,
    listVersion,
    mapRows,
    toSortField: quotationSortField,
    defaultSortColumn: 'billNo',
    defaultSortDir: 'desc',
    docLabelPlural: 'quotation(s)',
    supportsColumnFilters: true,
  });

  const { selectedId, setSelectedId, selectedRow } = useListRowSelection(list.rows);

  const openWorkspaceRaw = useCallback(
    (row?: QuotationListRow) => {
      publishOpenIntent(row ? { type: 'edit', documentId: row.id } : { type: 'new' });
      navigate('quotation-entry');
    },
    [navigate, publishOpenIntent],
  );

  const { canAdd, canEdit, canDelete, canExport, openWorkspace, authorizeDeleteRow } =
    useProtectedSalesListActions<QuotationListRow>(SALES_MODULE_CONFIG.quotation, {
      onOpenNew: () => openWorkspaceRaw(),
      onOpenEdit: (row) => openWorkspaceRaw(row),
      setStatusMessage: list.setStatusMessage,
    });

  const printRow = useSalesListRowPrint<QuotationListRow, QuotationRecord>({
    repository,
    documentType: 'quotation',
    recordToPrintable: (record) => mapQuotationToPrintableDocument(recordToUiSnapshot(record)),
    loadRecord: (row) => {
      if (!repository) return Promise.reject(new Error('Repository not ready.'));
      return loadSalesListRecord(repository, row, 'Quotation');
    },
    setStatusMessage: list.setStatusMessage,
  });

  const handleDelete = useDocumentListDelete<QuotationListRow>({
    repository,
    docLabel: 'quotation',
    invalidateList: invalidateQuotationList,
    reload: list.reload,
    setStatusMessage: list.setStatusMessage,
    authorizeDelete: authorizeDeleteRow,
  });

  const columns = useMemo((): DataGridColumn<QuotationListRow>[] => {
    return [
      createListActionColumn({
        onPrint: (row) => void printRow(row),
        onEdit: (row) => void openWorkspace(row),
        onDelete: (row) => void handleDelete(row),
        canEdit,
        canDelete,
      }),
      { id: 'billNo', header: 'Quote No', width: 120, readOnly: true, getValue: (r) => r.billNo },
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
    title: 'Quotation Register',
    documentType: 'quotation',
    docLabelPlural: 'quotation(s)',
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

  return (
    <RefinedScreenShell className="sales-invoice-list-screen transaction-list-screen">
      <TransactionEntryShell title="Quotes">
        <FormKeyboardScope className="si-list-layout" autoFocusFieldKey="list-search">
          <div className="si-list-toolbar">
            <div className="si-list-toolbar__row">
              <select
                className="wpf-form-combo si-list-toolbar__filter-pick"
                value={list.statusFilter}
                onChange={(e) => list.setStatusFilter(e.target.value)}
                aria-label="Status filter"
              >
                {['All', 'Open', 'Draft', 'Confirmed'].map((s) => (
                  <option key={s} value={s}>{s === 'All' ? '-- Filters --' : s}</option>
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
                title="New quotation (Ctrl+N)"
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
