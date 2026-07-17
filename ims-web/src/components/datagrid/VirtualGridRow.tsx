import { memo, type KeyboardEvent } from 'react';
import type { DataGridColumn } from './CorporateDataGrid';

export interface VirtualGridRowProps<T extends { id: string }> {
  row: T;
  rowIndex: number;
  columns: DataGridColumn<T>[];
  gridTemplate: string;
  rowHeight: number;
  activeColIndex: number | null;
  variant: 'transaction' | 'so-list';
  onRowDoubleClick?: (row: T, rowIndex: number) => void;
  onRowClick?: (row: T, rowIndex: number) => void;
  isSelected?: boolean;
  onCellKeyDown: (e: KeyboardEvent, rowIndex: number, colIndex: number) => void;
  onFocusCell: (rowIndex: number, colIndex: number) => void;
  onRowChange?: (row: T) => void;
  registerInputRef: (rowIndex: number, colIndex: number, el: HTMLInputElement | null) => void;
}

function VirtualGridRowInner<T extends { id: string }>({
  row,
  rowIndex,
  columns,
  gridTemplate,
  rowHeight,
  activeColIndex,
  variant,
  onRowDoubleClick,
  onRowClick,
  isSelected = false,
  onCellKeyDown,
  onFocusCell,
  onRowChange,
  registerInputRef,
}: VirtualGridRowProps<T>) {
  return (
    <div
      className={[
        'corporate-data-grid__row',
        variant === 'so-list' && rowIndex % 2 === 1 ? 'corporate-data-grid__row--alt' : '',
        isSelected ? 'corporate-data-grid__row--selected' : '',
      ]
        .filter(Boolean)
        .join(' ')}
      style={{ gridTemplateColumns: gridTemplate, height: rowHeight }}
      role="row"
      aria-selected={isSelected}
      onClick={() => onRowClick?.(row, rowIndex)}
      onDoubleClick={() => onRowDoubleClick?.(row, rowIndex)}
    >
      {columns.map((col, colIndex) => {
        const isActive = activeColIndex === colIndex;
        if (col.render) {
          return (
            <div key={col.id} className="corporate-data-grid__cell" role="gridcell">
              {col.render(row, rowIndex)}
            </div>
          );
        }
        const readOnly = col.readOnly ?? !col.setValue;
        const value = col.getValue?.(row) ?? '';
        if (readOnly) {
          return (
            <div
              key={col.id}
              className="corporate-data-grid__cell corporate-data-grid__cell--readonly"
              role="gridcell"
            >
              {String(value)}
            </div>
          );
        }
        return (
          <div
            key={col.id}
            className={`corporate-data-grid__cell${isActive ? ' corporate-data-grid__cell--active' : ''}`}
            role="gridcell"
          >
            <input
              ref={(el) => registerInputRef(rowIndex, colIndex, el)}
              className="corporate-data-grid__input"
              tabIndex={isActive ? 0 : -1}
              value={String(value)}
              onFocus={() => onFocusCell(rowIndex, colIndex)}
              onKeyDown={(e) => onCellKeyDown(e, rowIndex, colIndex)}
              onChange={(e) => {
                if (!col.setValue || !onRowChange) return;
                onRowChange(col.setValue(row, e.target.value));
              }}
              aria-label={`${col.header} row ${rowIndex + 1}`}
            />
          </div>
        );
      })}
    </div>
  );
}

function rowPropsEqual<T extends { id: string }>(
  prev: VirtualGridRowProps<T>,
  next: VirtualGridRowProps<T>,
): boolean {
  return (
    prev.row === next.row &&
    prev.rowIndex === next.rowIndex &&
    prev.activeColIndex === next.activeColIndex &&
    prev.columns === next.columns &&
    prev.gridTemplate === next.gridTemplate &&
    prev.rowHeight === next.rowHeight &&
    prev.variant === next.variant &&
    prev.isSelected === next.isSelected
  );
}

export const VirtualGridRow = memo(VirtualGridRowInner, rowPropsEqual) as typeof VirtualGridRowInner;
