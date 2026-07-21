import { useCallback, useEffect, useMemo } from 'react';
import { CorporateDataGrid, type DataGridColumn } from '../components/datagrid/CorporateDataGrid';
import { ListGridArea } from '../components/loading';
import { TransactionEntryShell } from '../components/transaction/TransactionEntryShell';
import {
  NUMBERED_SALES_SORTABLE_COLUMN_IDS,
  useNumberedSalesSortField,
} from '../components/transaction/numberedSalesListScreenHelpers';
import { TransactionListPagination } from '../components/transaction/TransactionListPagination';
import { SALES_MODULE_CONFIG } from '../components/transaction/salesModuleConfig';
import {
  createListActionColumn,
  useDocumentListDelete,
  useListRowSelection,
} from '../components/transaction/transactionListCrud';
import { useListExportActions } from '../components/transaction/useListExportActions';
import { useListNewShortcut } from '../components/transaction/useListNewShortcut';
import { useProtectedSalesListActions } from '../components/transaction/useProtectedSalesListActions';
import { useTransactionListLoader } from '../components/transaction/useTransactionListLoader';
import { useAppNavigation } from '../context/AppNavigationContext';
import { mapSalesReturnToPrintableDocument } from '../document/mappers/salesReturnPrintMapper';
import {
  loadSalesListRecord,
  useSalesListRowPrint,
} from '../components/transaction/useSalesListRowPrint';
import { FormKeyboardScope } from '../keyboard/FormKeyboardScope';
import { RefinedScreenShell } from '../screens/RefinedScreenShell';
import { SalesListSectionHeader } from '../sales/SalesListSectionHeader';
import { SalesListToolbar } from '../sales/SalesListToolbar';
import {
  salesListAmountColumn,
  salesListDocNoColumn,
  salesListStatusColumn,
} from '../sales/salesListColumnHelpers';
import '../sales/sales-list-layout.scss';
import { useSalesReturnNavIntent } from './context/SalesReturnNavIntent';
import { invalidateSalesReturnList } from './repository/listCache';
import { listRowsFromRecords } from './repository/localSalesReturnRepository';
import { recordToListRow, recordToUiSnapshot } from './repository/recordMappers';
import {
  useSalesReturnListVersion,
  useSalesReturnRepositoryOptional,
} from './repository/SalesReturnRepositoryContext';
import type { SalesReturnListRow } from './types';
import type { SalesReturnRecord } from './repository/types';

export function SalesReturnListScreen() {
  const navigate = useAppNavigation();
  const { publishOpenIntent } = useSalesReturnNavIntent();
  const repoCtx = useSalesReturnRepositoryOptional();
  const repository = repoCtx?.repository;
  const listVersion = useSalesReturnListVersion();
  const toSortField = useNumberedSalesSortField('returnDate');

  const mapRows = useCallback(
    (items: unknown[], mode: 'http' | 'local') =>
      mode === 'local'
        ? listRowsFromRecords(items as SalesReturnRecord[])
        : (items as SalesReturnRecord[]).map(recordToListRow),
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
    docLabelPlural: 'sales return(s)',
  });

  const { selectedId, setSelectedId, selectedRow } = useListRowSelection(list.rows);

  const openWorkspaceRaw = useCallback(
    (row?: SalesReturnListRow) => {
      publishOpenIntent(row ? { type: 'edit', documentId: row.id } : { type: 'new' });
      navigate('sales-return-entry');
    },
    [navigate, publishOpenIntent],
  );

  const { canAdd, canEdit, canDelete, canExport, openWorkspace, authorizeDeleteRow } =
    useProtectedSalesListActions<SalesReturnListRow>(SALES_MODULE_CONFIG.salesReturn, {
      onOpenNew: () => openWorkspaceRaw(),
      onOpenEdit: (row) => openWorkspaceRaw(row),
      setStatusMessage: list.setStatusMessage,
    });

  const printRow = useSalesListRowPrint<SalesReturnListRow, SalesReturnRecord>({
    repository,
    documentType: 'sales_return',
    recordToPrintable: (record) => mapSalesReturnToPrintableDocument(recordToUiSnapshot(record)),
    loadRecord: (row) => {
      if (!repository) return Promise.reject(new Error('Repository not ready.'));
      return loadSalesListRecord(repository, row, 'Sales return');
    },
    setStatusMessage: list.setStatusMessage,
  });

  const handleDelete = useDocumentListDelete<SalesReturnListRow>({
    repository,
    docLabel: 'sales return',
    invalidateList: invalidateSalesReturnList,
    reload: list.reload,
    setStatusMessage: list.setStatusMessage,
    authorizeDelete: authorizeDeleteRow,
  });

  const columns = useMemo((): DataGridColumn<SalesReturnListRow>[] => {
    return [
      createListActionColumn({
        onPrint: (row) => void printRow(row),
        onEdit: (row) => void openWorkspace(row),
        onDelete: (row) => void handleDelete(row),
        canEdit,
        canDelete,
      }),
      salesListDocNoColumn('Return No.', (row) => void openWorkspace(row)),
      { id: 'customer', header: 'Customer', width: '*', minWidth: 180, readOnly: true, getValue: (r) => r.customer },
      salesListAmountColumn('Return Total'),
      salesListStatusColumn(),
    ];
  }, [canDelete, canEdit, handleDelete, openWorkspace, printRow]);

  const exportColumns = useMemo(
    () => columns.filter((c) => c.id !== 'actions').map((c) => ({ id: c.id, header: String(c.header) })),
    [columns],
  );

  const listExport = useListExportActions({
    title: 'Sales Return Register',
    documentType: 'sales_return',
    docLabelPlural: 'sales return(s)',
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
    <RefinedScreenShell className="sales-invoice-list-screen">
      <TransactionEntryShell title="Returns">
        <FormKeyboardScope className="si-list-layout sales-hub-list" autoFocusFieldKey="list-search">
          <SalesListSectionHeader title="Returns" iconGlyph={'\uE10F'} />
          <SalesListToolbar
            searchPlaceholder="Search returns, customers..."
            searchValue={list.searchInput}
            onSearchChange={list.setSearchInput}
            statusFilter={list.statusFilter}
            statusOptions={['All', 'Open', 'Draft', 'Confirmed']}
            onStatusFilterChange={list.setStatusFilter}
            onRefresh={() => void list.reload()}
            onClearFilters={list.clearFilters}
            hasActiveFilters={list.hasActiveFilters}
            loading={list.loading}
            canAdd={canAdd}
            onAddNew={() => void openWorkspace()}
            addNewTitle="New return (Ctrl+N)"
            exportDisabled={listExport.exportDisabled}
            exportBusy={listExport.exporting}
            onExport={(format) => void listExport.runExport(format)}
            statusMessage={list.statusMessage}
          />
          <ListGridArea loading={list.loading}>
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
              variant="sales"
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
