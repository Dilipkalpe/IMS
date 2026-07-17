import { memo, useCallback, useMemo, useRef, useState } from 'react';
import {
  CorporateDataGrid,
  type CorporateDataGridHandle,
  type DataGridColumn,
} from '../../components/datagrid/CorporateDataGrid';
import { createBalStkColumn } from '../../components/datagrid/purchaseBalStkColumn';
import { SalesProductScanBar } from '../../components/transaction/SalesProductScanBar';
import type { GrnLineDisplay } from '../lineDisplay';
import type { GrnLineItem } from '../types';
import type { useGrnDocument } from '../useGrnDocument';

type Doc = ReturnType<typeof useGrnDocument>;

export interface GrnLineItemsGridProps {
  doc: Doc;
  gridRef?: React.RefObject<CorporateDataGridHandle | null>;
  onExitGridEnd?: () => void;
}

function GrnLineItemsGridInner({ doc, gridRef, onExitGridEnd }: GrnLineItemsGridProps) {
  const displayMapRef = useRef(doc.lineDisplayMap);
  displayMapRef.current = doc.lineDisplayMap;
  const [focusRowAfterDelete, setFocusRowAfterDelete] = useState<number | null>(null);

  const readDisplay = useCallback(
    (lineId: string, key: keyof GrnLineDisplay) => displayMapRef.current.get(lineId)?.[key] ?? '',
    [],
  );

  const handleDelete = useCallback(
    (row: GrnLineItem, rowIndex: number) => {
      doc.deleteLine(row.id);
      setFocusRowAfterDelete(Math.max(0, rowIndex - 1));
    },
    [doc],
  );

  const columns = useMemo((): DataGridColumn<GrnLineItem>[] => {
    const numPatch = (key: keyof GrnLineItem) => ({
      setValue: (row: GrnLineItem, raw: string) => {
        const n = parseFloat(raw);
        const value = Number.isFinite(n) ? n : 0;
        return { ...row, [key]: value };
      },
      getValue: (row: GrnLineItem) => row[key] as number,
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
      createBalStkColumn<GrnLineItem>(),
      {
        id: 'poRef',
        header: 'PO Ref',
        width: 80,
        readOnly: true,
        getValue: (r) => r.poFormattedDocNo ?? '',
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

  const onRowChange = useCallback(
    (row: GrnLineItem) => {
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
          editableColumnIds={['qty', 'rate', 'disc']}
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

export const GrnLineItemsGrid = memo(GrnLineItemsGridInner);
