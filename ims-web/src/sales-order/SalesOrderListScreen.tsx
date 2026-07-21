import { useCallback, useEffect, useMemo } from 'react';
import { CorporateDataGrid, type DataGridColumn } from '../components/datagrid/CorporateDataGrid';
import { ListGridArea } from '../components/loading';
import { TransactionEntryShell } from '../components/transaction/TransactionEntryShell';
import {
  salesOrderSortField,
} from '../components/transaction/transactionListQuery';
import { useListNewShortcut } from '../components/transaction/useListNewShortcut';
import { TransactionListPagination } from '../components/transaction/TransactionListPagination';
import { SALES_MODULE_CONFIG } from '../components/transaction/salesModuleConfig';
import { createListActionColumn, useListRowSelection } from '../components/transaction/transactionListCrud';
import { useListExportActions } from '../components/transaction/useListExportActions';
import { useProtectedSalesListActions } from '../components/transaction/useProtectedSalesListActions';
import { useTransactionListLoader } from '../components/transaction/useTransactionListLoader';
import { useAppNavigation } from '../context/AppNavigationContext';
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
import { SALES_ORDER_STATUS_FILTERS } from './mockData';
import { parseFormattedSoNo } from './soDocumentNo';
import type { SalesOrderListRow } from './types';
import type { SalesOrderRecord } from './repository/types';

const SORTABLE_COLUMN_IDS = ['billNo', 'customer', 'amount', 'status'];

export function SalesOrderListScreen() {
  const navigate = useAppNavigation();
  const { publishOpenIntent } = useSalesOrderNavIntent();
  const repoCtx = useSalesOrderRepositoryOptional();
  const repository = repoCtx?.repository;
  const listVersion = useSalesOrderListVersion();

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
      salesListDocNoColumn('Order No.', (row) => void openWorkspace(row)),
      { id: 'customer', header: 'Customer', width: '*', minWidth: 180, readOnly: true, getValue: (r) => r.customer },
      salesListAmountColumn('Order Total'),
      salesListStatusColumn(),
    ];
  }, [canDelete, canEdit, deleteRow, openWorkspace, printRow]);

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

  return (
    <RefinedScreenShell className="sales-invoice-list-screen">
      <TransactionEntryShell title="Sales Orders">
        <FormKeyboardScope className="si-list-layout sales-hub-list" autoFocusFieldKey="list-search">
          <SalesListSectionHeader title="Sales Orders" iconGlyph={'\uE8A1'} />
          <SalesListToolbar
            searchPlaceholder="Search orders, customers..."
            searchValue={list.searchInput}
            onSearchChange={list.setSearchInput}
            statusFilter={list.statusFilter}
            statusOptions={SALES_ORDER_STATUS_FILTERS}
            onStatusFilterChange={list.setStatusFilter}
            onRefresh={() => void list.reload()}
            onClearFilters={list.clearFilters}
            hasActiveFilters={list.hasActiveFilters}
            loading={list.loading}
            canAdd={canAdd}
            onAddNew={() => void openWorkspace()}
            addNewTitle="New order (Ctrl+N)"
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
              sortableColumnIds={SORTABLE_COLUMN_IDS}
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
