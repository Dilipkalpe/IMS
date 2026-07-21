import { useCallback, useEffect, useMemo } from 'react';
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
import { useAppNavigation } from '../context/AppNavigationContext';
import { mapSalesInvoiceToPrintableDocument } from '../document/mappers/salesInvoicePrintMapper';
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
import { useSalesInvoiceNavIntent } from './context/SalesInvoiceNavIntent';
import { invalidateSalesInvoiceList } from './repository/listCache';
import { listRowsFromRecords } from './repository/localSalesInvoiceRepository';
import { recordToListRow, recordToUiSnapshot } from './repository/recordMappers';
import {
  useSalesInvoiceListVersion,
  useSalesInvoiceRepositoryOptional,
} from './repository/SalesInvoiceRepositoryContext';
import type { SalesInvoiceListRow } from './types';
import type { SalesInvoiceRecord } from './repository/types';

export function SalesInvoiceListScreen() {
  const navigate = useAppNavigation();
  const { publishOpenIntent } = useSalesInvoiceNavIntent();
  const repoCtx = useSalesInvoiceRepositoryOptional();
  const repository = repoCtx?.repository;
  const listVersion = useSalesInvoiceListVersion();
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
      salesListDocNoColumn('Invoice No.', (row) => void openWorkspace(row)),
      { id: 'customer', header: 'Customer', width: '*', minWidth: 180, readOnly: true, getValue: (r) => r.customer },
      salesListAmountColumn('Invoice Total'),
      salesListStatusColumn(),
      createListActionColumn({
        onPrint: (row) => void printRow(row),
        onEdit: (row) => void openWorkspace(row),
        onDelete: (row) => void handleDelete(row),
        canEdit,
        canDelete,
      }),
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

  return (
    <RefinedScreenShell className="sales-invoice-list-screen">
      <TransactionEntryShell title="Invoices">
        <FormKeyboardScope className="si-list-layout sales-hub-list" autoFocusFieldKey="list-search">
          <SalesListSectionHeader title="Invoices" iconGlyph={'\uE8A5'} />
          <SalesListToolbar
            searchPlaceholder="Search invoices, customers..."
            searchValue={list.searchInput}
            onSearchChange={list.setSearchInput}
            statusFilter={list.statusFilter}
            statusOptions={['All', 'Posted', 'Draft']}
            onStatusFilterChange={list.setStatusFilter}
            onRefresh={() => void list.reload()}
            onClearFilters={list.clearFilters}
            hasActiveFilters={list.hasActiveFilters}
            loading={list.loading}
            canAdd={canAdd}
            onAddNew={() => void openWorkspace()}
            addNewTitle="New invoice (Ctrl+N)"
            exportDisabled={listExport.exportDisabled}
            exportBusy={listExport.exporting}
            onExport={(format) => void listExport.runExport(format)}
            statusMessage={list.statusMessage}
          />
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
