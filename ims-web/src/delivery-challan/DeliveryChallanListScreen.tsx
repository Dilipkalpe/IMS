import { useCallback, useEffect, useMemo } from 'react';
import { CorporateDataGrid, type DataGridColumn } from '../components/datagrid/CorporateDataGrid';
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
import { RefinedScreenShell } from '../screens/RefinedScreenShell';
import { SalesListSectionHeader } from '../sales/SalesListSectionHeader';
import { SalesListToolbar } from '../sales/SalesListToolbar';
import {
  salesListAmountColumn,
  salesListDocNoColumn,
  salesListStatusColumn,
} from '../sales/salesListColumnHelpers';
import '../sales/sales-list-layout.scss';
import { useDeliveryChallanNavIntent } from './context/DeliveryChallanNavIntent';
import { invalidateDeliveryChallanList } from './repository/listCache';
import { listRowsFromRecords } from './repository/localDeliveryChallanRepository';
import { recordToListRow, recordToUiSnapshot } from './repository/recordMappers';
import { useDeliveryChallanListVersion, useDeliveryChallanRepositoryOptional } from './repository/DeliveryChallanRepositoryContext';
import type { DeliveryChallanListRow } from './types';
import type { DeliveryChallanRecord } from './repository/types';

const DC_SORTABLE_IDS = ['billNo', 'customer', 'amount', 'status'];

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
      salesListDocNoColumn('Delivery No.', (row) => void openWorkspace(row), 110),
      { id: 'customer', header: 'Customer', width: '*', minWidth: 160, readOnly: true, getValue: (r) => r.customer },
      { id: 'soReference', header: 'SO Ref', width: 100, readOnly: true, getValue: (r) => r.soReference },
      salesListAmountColumn('Delivery Total'),
      salesListStatusColumn(),
    ];
  }, [canDelete, canEdit, handleDelete, openWorkspace, printRow]);

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
      <TransactionEntryShell title="Deliveries">
        <FormKeyboardScope className="si-list-layout sales-hub-list" autoFocusFieldKey="list-search">
          <SalesListSectionHeader title="Deliveries" iconGlyph={'\uE7BF'} />
          <SalesListToolbar
            searchPlaceholder="Search deliveries, customers..."
            searchValue={list.searchInput}
            onSearchChange={list.setSearchInput}
            statusFilter={list.statusFilter}
            statusOptions={['All', 'Open', 'Draft', 'Posted']}
            onStatusFilterChange={list.setStatusFilter}
            onRefresh={() => void list.reload()}
            onClearFilters={list.clearFilters}
            hasActiveFilters={list.hasActiveFilters}
            loading={list.loading}
            canAdd={canAdd}
            onAddNew={() => void openWorkspace()}
            addNewTitle="New delivery (Ctrl+N)"
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
              sortableColumnIds={DC_SORTABLE_IDS}
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
