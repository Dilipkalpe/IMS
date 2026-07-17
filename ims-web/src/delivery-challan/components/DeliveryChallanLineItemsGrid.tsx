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
import type { DeliveryChallanLineDisplay } from '../lineDisplay';
import type { DeliveryChallanLineItem } from '../types';
import type { useDeliveryChallanDocument } from '../useDeliveryChallanDocument';

type Doc = ReturnType<typeof useDeliveryChallanDocument>;

export interface DeliveryChallanLineItemsGridProps {
  doc: Doc;
  gridRef?: React.RefObject<CorporateDataGridHandle | null>;
  onExitGridEnd?: () => void;
}

function DeliveryChallanLineItemsGridInner({ doc, gridRef, onExitGridEnd }: DeliveryChallanLineItemsGridProps) {
  const displayMapRef = useRef(doc.lineDisplayMap);
  displayMapRef.current = doc.lineDisplayMap;
  const [focusRowAfterDelete, setFocusRowAfterDelete] = useState<number | null>(null);

  const readDisplay = useCallback(
    (lineId: string, key: keyof DeliveryChallanLineDisplay) => displayMapRef.current.get(lineId)?.[key] ?? '',
    [],
  );

  const { deleteLineProtected } = useProtectedSalesLineDelete(SALES_MODULE_CONFIG.deliveryChallan, {
    billNo: doc.header.billNo || 'new',
    deleteLine: doc.deleteLine,
    setStatusMessage: doc.setStatus,
  });

  const handleDelete = useCallback(
    async (row: DeliveryChallanLineItem, rowIndex: number) => {
      const ok = await deleteLineProtected(row);
      if (ok) setFocusRowAfterDelete(Math.max(0, rowIndex - 1));
    },
    [deleteLineProtected],
  );

  const columns = useMemo((): DataGridColumn<DeliveryChallanLineItem>[] => {
    const numPatch = (key: keyof DeliveryChallanLineItem) => ({
      setValue: (row: DeliveryChallanLineItem, raw: string) => {
        const n = parseFloat(raw);
        const value = Number.isFinite(n) ? n : 0;
        return { ...row, [key]: value };
      },
      getValue: (row: DeliveryChallanLineItem) => row[key] as number,
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
            title="Delete line"
            tabIndex={-1}
            onClick={() => handleDelete(row, rowIndex)}
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
        minWidth: 140,
        readOnly: true,
        getValue: (r) => r.itemDescription,
      },
      {
        id: 'poRef',
        header: 'SO Ref',
        width: 80,
        readOnly: true,
        getValue: (r) => r.soFormattedDocNo ?? '',
      },
      { id: 'qty', header: 'Qty', width: 60, ...numPatch('qty') },
      { id: 'rate', header: 'Rate', width: 80, ...numPatch('rate') },
      { id: 'disc', header: 'Disc %', width: 70, ...numPatch('discPercent') },
      {
        id: 'taxable',
        header: 'Taxable',
        width: 85,
        readOnly: true,
        getValue: (r) => readDisplay(r.id, 'taxableDisplay'),
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
    moduleKey: 'delivery_challan',
    isInterState: doc.isInterState,
    allColumns: columns,
    editableColumnIds: ['qty', 'rate', 'disc'],
  });

  const onRowChange = useCallback(
    (row: DeliveryChallanLineItem) => {
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
        moduleKey="delivery_challan"
        moduleTitle="Delivery Challan"
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

export const DeliveryChallanLineItemsGrid = memo(DeliveryChallanLineItemsGridInner);
