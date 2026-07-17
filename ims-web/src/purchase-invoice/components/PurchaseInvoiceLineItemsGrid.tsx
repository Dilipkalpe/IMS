import { memo, useCallback, useMemo, useRef, useState } from 'react';
import {
  CorporateDataGrid,
  type CorporateDataGridHandle,
  type DataGridColumn,
} from '../../components/datagrid/CorporateDataGrid';
import { createBalStkColumn } from '../../components/datagrid/purchaseBalStkColumn';
import { SalesProductScanBar } from '../../components/transaction/SalesProductScanBar';
import type { PurchaseInvoiceLineDisplay } from '../lineDisplay';
import type { PurchaseInvoiceLineItem } from '../types';
import type { usePurchaseInvoiceDocument } from '../usePurchaseInvoiceDocument';

type Doc = ReturnType<typeof usePurchaseInvoiceDocument>;

export interface PurchaseInvoiceLineItemsGridProps {
  doc: Doc;
  gridRef?: React.RefObject<CorporateDataGridHandle | null>;
  onExitGridEnd?: () => void;
}

function PurchaseInvoiceLineItemsGridInner({ doc, gridRef, onExitGridEnd }: PurchaseInvoiceLineItemsGridProps) {
  const displayMapRef = useRef(doc.lineDisplayMap);
  displayMapRef.current = doc.lineDisplayMap;
  const [focusRowAfterDelete, setFocusRowAfterDelete] = useState<number | null>(null);

  const readDisplay = useCallback(
    (lineId: string, key: keyof PurchaseInvoiceLineDisplay) =>
      displayMapRef.current.get(lineId)?.[key] ?? '',
    [],
  );

  const handleDelete = useCallback(
    (row: PurchaseInvoiceLineItem, rowIndex: number) => {
      doc.deleteLine(row.id);
      setFocusRowAfterDelete(Math.max(0, rowIndex - 1));
    },
    [doc],
  );

  const columns = useMemo((): DataGridColumn<PurchaseInvoiceLineItem>[] => {
    const numPatch = (key: keyof PurchaseInvoiceLineItem) => ({
      setValue: (row: PurchaseInvoiceLineItem, raw: string) => {
        const n = parseFloat(raw);
        const value = Number.isFinite(n) ? n : 0;
        return { ...row, [key]: value };
      },
      getValue: (row: PurchaseInvoiceLineItem) => row[key] as number,
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
      createBalStkColumn<PurchaseInvoiceLineItem>(),
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

  const onRowChange = useCallback(
    (row: PurchaseInvoiceLineItem) => {
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
      />
      <div className="si-line-grid-frame">
        <CorporateDataGrid
          ref={gridRef}
          columns={columns}
          data={doc.lines}
          editableColumnIds={['qty', 'rate', 'salesRate', 'disc']}
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

export const PurchaseInvoiceLineItemsGrid = memo(PurchaseInvoiceLineItemsGridInner);
