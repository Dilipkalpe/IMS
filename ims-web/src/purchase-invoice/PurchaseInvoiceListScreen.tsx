import { useCallback, useEffect, useMemo, useState } from 'react';
import { CorporateDataGrid, buildGridTemplateColumns, type DataGridColumn } from '../components/datagrid/CorporateDataGrid';
import { ListGridArea } from '../components/loading';
import { TransactionEntryShell } from '../components/transaction/TransactionEntryShell';
import { TransactionListColumnFilters } from '../components/transaction/TransactionListColumnFilters';
import {
  PURCHASE_LIST_COLUMN_FILTER_DEFS,
  purchaseInvoiceSortField,
} from '../components/transaction/transactionListQuery';
import { useListNewShortcut } from '../components/transaction/useListNewShortcut';
import { TransactionListPagination } from '../components/transaction/TransactionListPagination';
import { PURCHASE_MODULE_CONFIG } from '../components/transaction/purchaseModuleConfig';
import {
  createListActionColumn,
  useDocumentListDelete,
  useListRowSelection,
} from '../components/transaction/transactionListCrud';
import { ListExportMenu } from '../components/transaction/ListExportMenu';
import { useListExportActions } from '../components/transaction/useListExportActions';
import { useProtectedSalesListActions } from '../components/transaction/useProtectedSalesListActions';
import { useTransactionListLoader } from '../components/transaction/useTransactionListLoader';
import { ListStatsRow } from '../components/transaction/ListStatsRow';
import { buildDataSourceStat, listStat } from '../components/transaction/listStatBuilders';
import { useListStats } from '../components/transaction/useListStats';
import { useAppNavigation } from '../context/AppNavigationContext';
import { FormKeyboardScope } from '../keyboard/FormKeyboardScope';
import { FIELD_FOCUS_KEY } from '../keyboard/formKeyboardNavigation';
import { RefinedScreenShell } from '../screens/RefinedScreenShell';
import '../sales-invoice/sales-invoice.scss';
import { usePurchaseInvoiceNavIntent } from './context/PurchaseInvoiceNavIntent';
import { invalidatePurchaseInvoiceList } from './repository/listCache';
import { listRowsFromRecords } from './repository/localPurchaseInvoiceRepository';
import { recordToListRow } from './repository/recordMappers';
import {
  usePurchaseInvoiceListVersion,
  usePurchaseInvoiceRepositoryOptional,
} from './repository/PurchaseInvoiceRepositoryContext';
import { BarcodeLabelPreviewDialog } from '../barcode-labels/BarcodeLabelPreviewDialog';
import { BarcodeLabelPrintDialog } from '../barcode-labels/BarcodeLabelPrintDialog';
import { usePurchaseInvoiceBarcodeLabels } from '../barcode-labels/usePurchaseInvoiceBarcodeLabels';
import type { PurchaseInvoiceListRow } from './types';
import type { PurchaseInvoiceRecord } from './repository/types';

const SORTABLE_COLUMN_IDS = ['billNo', 'date', 'supplier', 'amount', 'status'];

export function PurchaseInvoiceListScreen() {
  const navigate = useAppNavigation();
  const { publishOpenIntent } = usePurchaseInvoiceNavIntent();
  const repoCtx = usePurchaseInvoiceRepositoryOptional();
  const repository = repoCtx?.repository;
  const listVersion = usePurchaseInvoiceListVersion();
  const [stats, setStats] = useState({ total: 0, draft: 0, posted: 0 });

  const mapRows = useCallback(
    (items: unknown[], mode: 'http' | 'local') =>
      mode === 'local'
        ? listRowsFromRecords(items as PurchaseInvoiceRecord[])
        : (items as PurchaseInvoiceRecord[]).map(recordToListRow),
    [],
  );

  const list = useTransactionListLoader({
    repository,
    listVersion,
    mapRows,
    toSortField: purchaseInvoiceSortField,
    defaultSortColumn: 'billNo',
    defaultSortDir: 'desc',
    docLabelPlural: 'purchase invoice(s)',
    supportsColumnFilters: true,
  });

  const onStats = useCallback((listStats: Awaited<ReturnType<NonNullable<typeof repository>['fetchStats']>>) => {
    setStats({ total: listStats.total, draft: listStats.draft, posted: listStats.posted });
  }, []);

  useListStats(repository, listVersion, onStats);

  const { selectedId, setSelectedId, selectedRow } = useListRowSelection(list.rows);

  const openWorkspaceRaw = useCallback(
    (row?: PurchaseInvoiceListRow) => {
      publishOpenIntent(row ? { type: 'edit', documentId: row.id } : { type: 'new' });
      navigate('purchase-invoice-entry');
    },
    [navigate, publishOpenIntent],
  );

  const { canAdd, canEdit, canDelete, canExport, openWorkspace, authorizeDeleteRow } =
    useProtectedSalesListActions<PurchaseInvoiceListRow>(PURCHASE_MODULE_CONFIG.purchaseInvoice, {
      onOpenNew: () => openWorkspaceRaw(),
      onOpenEdit: (row) => openWorkspaceRaw(row),
      setStatusMessage: list.setStatusMessage,
      getPartyLabel: (row) => row.supplier?.trim() || row.billNo,
    });

  const barcodeLabels = usePurchaseInvoiceBarcodeLabels(repository ?? undefined);

  const handleDelete = useDocumentListDelete<PurchaseInvoiceListRow>({
    repository,
    docLabel: 'purchase invoice',
    invalidateList: invalidatePurchaseInvoiceList,
    reload: list.reload,
    setStatusMessage: list.setStatusMessage,
    authorizeDelete: authorizeDeleteRow,
  });

  const columns = useMemo((): DataGridColumn<PurchaseInvoiceListRow>[] => {
    return [
      createListActionColumn({
        onEdit: (row) => void openWorkspace(row),
        onDelete: (row) => void handleDelete(row),
        onBarcodeLabel: (row) => void barcodeLabels.openForBillNo(row.billNo),
        canEdit,
        canDelete,
        canBarcodeLabel: barcodeLabels.canPrintBarcodeLabels,
      }),
      { id: 'billNo', header: 'Bill No', width: 120, readOnly: true, getValue: (r) => r.billNo },
      { id: 'date', header: 'Date', width: 100, readOnly: true, getValue: (r) => r.date },
      { id: 'supplier', header: 'Supplier', width: '*', minWidth: 180, readOnly: true, getValue: (r) => r.supplier },
      { id: 'amount', header: 'Amount', width: 110, readOnly: true, getValue: (r) => r.amount },
      { id: 'status', header: 'Status', width: 90, readOnly: true, getValue: (r) => r.status },
    ];
  }, [barcodeLabels, canDelete, canEdit, handleDelete, openWorkspace]);

  const gridTemplate = useMemo(
    () => buildGridTemplateColumns(columns as DataGridColumn<unknown>[]),
    [columns],
  );

  const exportColumns = useMemo(
    () => columns.filter((c) => c.id !== 'actions').map((c) => ({ id: c.id, header: String(c.header) })),
    [columns],
  );

  const listExport = useListExportActions({
    title: 'Purchase Invoice Register',
    documentType: 'purchase_invoice',
    docLabelPlural: 'purchase invoice(s)',
    canExport,
    columns: exportColumns,
    rowToRecord: (r) => ({
      billNo: r.billNo,
      date: r.date,
      supplier: r.supplier,
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
      <TransactionEntryShell title="Purchase Invoice">
        <FormKeyboardScope className="si-list-layout" autoFocusFieldKey="list-search">
          <ListStatsRow
            stats={[
              listStat('Total invoices', stats.total, 'total'),
              listStat('Posted', stats.posted, 'posted'),
              listStat('Draft', stats.draft, 'draft'),
              buildDataSourceStat(repoCtx?.mode),
            ]}
          />
          <div className="si-list-toolbar">
            <div className="si-list-toolbar__row">
              <button
                type="button"
                className="wpf-action-button"
                {...{ [FIELD_FOCUS_KEY]: 'list-new' }}
                title="New invoice (Ctrl+N)"
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
                placeholder="Search bill no, supplier…"
                value={list.searchInput}
                onChange={(e) => list.setSearchInput(e.target.value)}
              />
              <select
                className="wpf-form-combo si-list-toolbar__filter"
                value={list.statusFilter}
                onChange={(e) => list.setStatusFilter(e.target.value)}
              >
                {['All', 'Posted', 'Draft'].map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
              <button type="button" className="wpf-action-button" onClick={() => void list.reload()} disabled={list.loading}>
                Refresh
              </button>
              <button
                type="button"
                className="wpf-action-button"
                onClick={list.clearFilters}
                disabled={!list.hasActiveFilters}
              >
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
            <TransactionListColumnFilters
              columns={PURCHASE_LIST_COLUMN_FILTER_DEFS}
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

      <BarcodeLabelPrintDialog
        open={barcodeLabels.dialogOpen}
        invoiceCaption={barcodeLabels.invoiceCaption}
        busy={barcodeLabels.busy}
        onClose={barcodeLabels.closeDialog}
        onGenerate={(options) => void barcodeLabels.handleGenerate(options)}
      />
      <BarcodeLabelPreviewDialog
        open={barcodeLabels.previewOpen}
        title={barcodeLabels.previewTitle}
        result={barcodeLabels.result}
        previewHtml={barcodeLabels.previewHtml}
        onClose={barcodeLabels.closePreview}
        onPrint={barcodeLabels.handlePrint}
        onDownload={barcodeLabels.handleDownload}
      />
    </RefinedScreenShell>
  );
}
