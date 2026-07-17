import { memo, useCallback, useMemo, useRef, useState } from 'react';
import {
  CorporateDataGrid,
  type CorporateDataGridHandle,
  type DataGridColumn,
} from '../../components/datagrid/CorporateDataGrid';
import { SALES_MODULE_CONFIG } from '../../components/transaction/salesModuleConfig';
import { SalesProductScanBar } from '../../components/transaction/SalesProductScanBar';
import { useProtectedSalesLineDelete } from '../../components/transaction/useProtectedSalesLineDelete';
import { TransactionLineGridColumnDialog } from '../../components/transaction/TransactionLineGridColumnDialog';
import { useTransactionLineGridColumns } from '../../components/transaction/useTransactionLineGridColumns';
import type { SalesInvoiceLineDisplay } from '../lineDisplay';
import type { SalesInvoiceLineItem } from '../types';
import type { useSalesInvoiceDocument } from '../useSalesInvoiceDocument';

type Doc = ReturnType<typeof useSalesInvoiceDocument>;

export interface SalesInvoiceLineItemsGridProps {
  doc: Doc;
  gridRef?: React.RefObject<CorporateDataGridHandle | null>;
  onExitGridEnd?: () => void;
}

function SalesInvoiceLineItemsGridInner({ doc, gridRef, onExitGridEnd }: SalesInvoiceLineItemsGridProps) {
  const displayMapRef = useRef(doc.lineDisplayMap);
  displayMapRef.current = doc.lineDisplayMap;
  const [focusRowAfterDelete, setFocusRowAfterDelete] = useState<number | null>(null);

  const readDisplay = useCallback(
    (lineId: string, key: keyof SalesInvoiceLineDisplay) =>
      displayMapRef.current.get(lineId)?.[key] ?? '',
    [],
  );

  const { deleteLineProtected } = useProtectedSalesLineDelete(SALES_MODULE_CONFIG.salesInvoice, {
    billNo: doc.header.billNo || 'new',
    deleteLine: doc.deleteLine,
    setStatusMessage: doc.setStatus,
  });

  const handleDelete = useCallback(
    async (row: SalesInvoiceLineItem, rowIndex: number) => {
      const ok = await deleteLineProtected(row);
      if (ok) setFocusRowAfterDelete(Math.max(0, rowIndex - 1));
    },
    [deleteLineProtected],
  );

  const columns = useMemo((): DataGridColumn<SalesInvoiceLineItem>[] => {
    const numPatch = (key: keyof SalesInvoiceLineItem) => ({
      setValue: (row: SalesInvoiceLineItem, raw: string) => {
        const n = parseFloat(raw);
        const value = Number.isFinite(n) ? n : 0;
        return { ...row, [key]: value };
      },
      getValue: (row: SalesInvoiceLineItem) => row[key] as number,
    });

    return [
      {
        id: 'delete',
        header: '',
        width: 40,
        readOnly: true,
        render: (row, rowIndex) => (
          <button
            type="button"
            className="corporate-data-grid__delete-btn"
            title="Delete line (focus and press Enter)"
            tabIndex={-1}
            onClick={() => handleDelete(row, rowIndex)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                handleDelete(row, rowIndex);
              }
            }}
            aria-label={`Delete line ${rowIndex + 1}`}
          >
            &#xE74D;
          </button>
        ),
      },
      { id: 'sr', header: 'Sr', width: 40, readOnly: true, getValue: (r) => r.sr },
      { id: 'code', header: 'Code', width: 90, readOnly: true, getValue: (r) => r.productRetailCode },
      {
        id: 'desc',
        header: 'Item Description',
        width: '*',
        minWidth: 160,
        readOnly: true,
        getValue: (r) => r.itemDescription,
      },
      {
        id: 'dcRef',
        header: 'DC Ref',
        width: 80,
        readOnly: true,
        getValue: (r) => r.dcFormattedDocNo ?? '',
      },
      { id: 'qty', header: 'Qty', width: 60, ...numPatch('qty') },
      { id: 'rate', header: 'Rate', width: 80, ...numPatch('rate') },
      { id: 'salesRate', header: 'Sale Rate', width: 80, ...numPatch('salesRate') },
      { id: 'disc', header: 'Line Disc %', width: 80, ...numPatch('discPercent') },
      {
        id: 'taxable',
        header: 'Taxable Value',
        width: 95,
        readOnly: true,
        getValue: (r) => readDisplay(r.id, 'taxableDisplay'),
      },
      {
        id: 'cgstPct',
        header: 'CGST %',
        width: 70,
        readOnly: true,
        getValue: (r) => readDisplay(r.id, 'cgstPercentDisplay'),
      },
      {
        id: 'cgstAmt',
        header: 'CGST Amt',
        width: 85,
        readOnly: true,
        getValue: (r) => readDisplay(r.id, 'cgstAmountDisplay'),
      },
      {
        id: 'sgstPct',
        header: 'SGST %',
        width: 70,
        readOnly: true,
        getValue: (r) => readDisplay(r.id, 'sgstPercentDisplay'),
      },
      {
        id: 'sgstAmt',
        header: 'SGST Amt',
        width: 85,
        readOnly: true,
        getValue: (r) => readDisplay(r.id, 'sgstAmountDisplay'),
      },
      {
        id: 'igstPct',
        header: 'IGST %',
        width: 70,
        readOnly: true,
        getValue: (r) => readDisplay(r.id, 'igstPercentDisplay'),
      },
      {
        id: 'igstAmt',
        header: 'IGST Amt',
        width: 85,
        readOnly: true,
        getValue: (r) => readDisplay(r.id, 'igstAmountDisplay'),
      },
      {
        id: 'total',
        header: 'Line Total',
        width: 90,
        readOnly: true,
        getValue: (r) => readDisplay(r.id, 'lineTotalDisplay'),
      },
    ];
  }, [handleDelete, readDisplay]);

  const lineGridColumns = useTransactionLineGridColumns({
    moduleKey: 'sales_invoice',
    isInterState: doc.isInterState,
    allColumns: columns,
    editableColumnIds: ['qty', 'rate', 'salesRate', 'disc'],
  });

  const onRowChange = useCallback(
    (row: SalesInvoiceLineItem) => {
      doc.updateLine(row.id, row);
    },
    [doc],
  );

  return (
    <div className="si-line-items">
      <SalesProductScanBar
        barcode={doc.barcode}
        onBarcodeChange={doc.setBarcode}
        onScan={doc.addLineFromScan}
        onBrowsePick={doc.addProductsFromBrowse}
        onManageColumns={lineGridColumns.openColumnSettings}
      />
      <TransactionLineGridColumnDialog
        open={lineGridColumns.dialogOpen}
        moduleKey="sales_invoice"
        moduleTitle="Sales Invoice"
        columns={lineGridColumns.catalogColumns}
        visibleKeys={lineGridColumns.visibleKeys}
        isBusy={lineGridColumns.isBusy}
        onClose={lineGridColumns.closeColumnSettings}
        onApply={lineGridColumns.applyColumnSettings}
      />
      <div className="si-line-grid-frame">
        <CorporateDataGrid
          ref={gridRef}
          columns={lineGridColumns.visibleColumns}
          data={doc.lines}
          editableColumnIds={lineGridColumns.visibleEditableColumnIds}
          onRowChange={onRowChange}
          minHeight={218}
          onExitEnd={onExitGridEnd}
          focusRowIndexAfterDelete={focusRowAfterDelete}
          onFocusRowIndexApplied={() => setFocusRowAfterDelete(null)}
        />
      </div>
      {doc.lineCount > 0 && (
        <p className="si-line-items__count" aria-live="polite">
          {doc.lineCount.toLocaleString()} line(s)
          {doc.lineCount > 25 ? ' · virtualized' : ''}
        </p>
      )}
      {doc.fieldError('lines') && (
        <p className="si-field-error" role="alert">
          {doc.fieldError('lines')}
        </p>
      )}
    </div>
  );
}

export const SalesInvoiceLineItemsGrid = memo(SalesInvoiceLineItemsGridInner);
