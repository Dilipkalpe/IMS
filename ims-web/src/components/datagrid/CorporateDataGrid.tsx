import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
} from 'react';
import { VirtualGridRow } from './VirtualGridRow';
import './CorporateDataGrid.scss';

export interface DataGridColumn<T> {
  id: string;
  header: string;
  width?: number | string;
  minWidth?: number;
  readOnly?: boolean;
  render?: (row: T, rowIndex: number) => React.ReactNode;
  getValue?: (row: T) => string | number;
  setValue?: (row: T, value: string) => T;
}

/** Shared grid track sizing for CorporateDataGrid headers, rows, and list filter rows. */
export function buildGridTemplateColumns(columns: DataGridColumn<unknown>[]): string {
  return columns
    .map((c) => {
      if (c.width === '*') {
        const min = c.minWidth ?? 120;
        return `minmax(${min}px, 1fr)`;
      }
      if (typeof c.width === 'number') return `${c.width}px`;
      return c.width ?? '80px';
    })
    .join(' ');
}

export interface CorporateDataGridProps<T extends { id: string }> {
  columns: DataGridColumn<T>[];
  data: T[];
  rowHeight?: number;
  headerHeight?: number;
  minHeight?: number;
  editableColumnIds?: string[];
  onRowChange?: (row: T) => void;
  onDeleteRow?: (row: T) => void;
  onRowDoubleClick?: (row: T, rowIndex: number) => void;
  onRowClick?: (row: T, rowIndex: number) => void;
  selectedRowId?: string | null;
  onExitEnd?: () => void;
  focusRowIndexAfterDelete?: number | null;
  onFocusRowIndexApplied?: () => void;
  className?: string;
  /** Default: true when data.length > 25 */
  virtualize?: boolean;
  variant?: 'transaction' | 'so-list';
  sortColumnId?: string | null;
  sortDir?: 'asc' | 'desc';
  sortableColumnIds?: string[];
  onSortColumn?: (columnId: string) => void;
  /** Accepted for list/report screens; prefer wrapping the grid in LoadingHost when loading. */
  loading?: boolean;
  emptyMessage?: string;
}

export interface CorporateDataGridHandle {
  focusFirstEditable: () => void;
  focusLineColumn: (lineId: string, columnId: string) => void;
  focusCell: (rowIndex: number, columnId: string) => void;
}

const DEFAULT_ROW = 24;
const DEFAULT_HEADER = 26;
const VIRTUALIZE_THRESHOLD = 25;
const OVERSCAN_ROWS = 8;

type CellCoord = { rowIndex: number; colIndex: number };

function CorporateDataGridInner<T extends { id: string }>(
  {
    columns,
    data,
    rowHeight = DEFAULT_ROW,
    headerHeight = DEFAULT_HEADER,
    minHeight = 218,
    editableColumnIds,
    onRowChange,
    onRowDoubleClick,
    onRowClick,
    selectedRowId,
    onExitEnd,
    focusRowIndexAfterDelete,
    onFocusRowIndexApplied,
    className,
    virtualize: virtualizeProp,
    variant = 'transaction',
    sortColumnId = null,
    sortDir = 'desc',
    sortableColumnIds,
    onSortColumn,
    emptyMessage,
  }: CorporateDataGridProps<T>,
  ref: React.ForwardedRef<CorporateDataGridHandle>,
) {
  const virtualize = virtualizeProp ?? data.length > VIRTUALIZE_THRESHOLD;

  const editableSet = useMemo(
    () => new Set(editableColumnIds ?? columns.filter((c) => c.setValue && !c.readOnly).map((c) => c.id)),
    [columns, editableColumnIds],
  );

  const editableColIndexes = useMemo(
    () => columns.map((c, i) => (editableSet.has(c.id) ? i : -1)).filter((i) => i >= 0),
    [columns, editableSet],
  );

  const colIdToIndex = useMemo(() => new Map(columns.map((c, i) => [c.id, i])), [columns]);

  const [activeCell, setActiveCell] = useState<CellCoord | null>(() =>
    data.length > 0 && editableColIndexes.length > 0
      ? { rowIndex: 0, colIndex: editableColIndexes[0] }
      : null,
  );

  const [scrollTop, setScrollTop] = useState(0);
  const bodyRef = useRef<HTMLDivElement>(null);
  const inputRefs = useRef<Map<string, HTMLInputElement>>(new Map());
  const [viewportHeight, setViewportHeight] = useState(minHeight);
  const scrollRaf = useRef<number | null>(null);

  const cellKey = (rowIndex: number, colIndex: number) => `${rowIndex}:${colIndex}`;

  const applyScrollTop = useCallback((next: number) => {
    setScrollTop(next);
  }, []);

  const scrollRowIntoView = useCallback(
    (rowIndex: number) => {
      const body = bodyRef.current;
      if (!body) return;
      const top = rowIndex * rowHeight;
      const bottom = top + rowHeight;
      let next = body.scrollTop;
      if (top < body.scrollTop) next = top;
      else if (bottom > body.scrollTop + body.clientHeight) next = bottom - body.clientHeight;
      if (next !== body.scrollTop) {
        body.scrollTop = next;
        applyScrollTop(next);
      }
    },
    [rowHeight, applyScrollTop],
  );

  const focusInputAt = useCallback(
    (rowIndex: number, colIndex: number) => {
      scrollRowIntoView(rowIndex);
      const input = inputRefs.current.get(cellKey(rowIndex, colIndex));
      if (input) {
        input.focus();
        input.select();
      }
    },
    [scrollRowIntoView],
  );

  const registerInputRef = useCallback((rowIndex: number, colIndex: number, el: HTMLInputElement | null) => {
    const k = cellKey(rowIndex, colIndex);
    if (el) inputRefs.current.set(k, el);
    else inputRefs.current.delete(k);
  }, []);

  useImperativeHandle(
    ref,
    () => ({
      focusFirstEditable() {
        if (data.length === 0 || editableColIndexes.length === 0) return;
        const coord = { rowIndex: 0, colIndex: editableColIndexes[0] };
        setActiveCell(coord);
      },
      focusLineColumn(lineId: string, columnId: string) {
        const rowIndex = data.findIndex((r) => r.id === lineId);
        const colIndex = colIdToIndex.get(columnId);
        if (rowIndex < 0 || colIndex === undefined || !editableSet.has(columnId)) return;
        setActiveCell({ rowIndex, colIndex });
      },
      focusCell(rowIndex: number, columnId: string) {
        const colIndex = colIdToIndex.get(columnId);
        if (rowIndex < 0 || rowIndex >= data.length || colIndex === undefined) return;
        if (!editableSet.has(columnId)) return;
        setActiveCell({ rowIndex, colIndex });
      },
    }),
    [colIdToIndex, data, editableColIndexes, editableSet],
  );

  useEffect(() => {
    const el = bodyRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setViewportHeight(el.clientHeight));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    if (data.length === 0) {
      setActiveCell(null);
      return;
    }
    if (!activeCell) return;
    if (activeCell.rowIndex >= data.length) {
      setActiveCell({
        rowIndex: Math.max(0, data.length - 1),
        colIndex: activeCell.colIndex,
      });
    }
  }, [data.length, activeCell]);

  useLayoutEffect(() => {
    if (!activeCell) return;
    focusInputAt(activeCell.rowIndex, activeCell.colIndex);
  }, [activeCell?.rowIndex, activeCell?.colIndex, focusInputAt]);

  useEffect(() => {
    if (focusRowIndexAfterDelete == null || editableColIndexes.length === 0) return;
    const rowIndex = Math.min(focusRowIndexAfterDelete, Math.max(0, data.length - 1));
    if (data.length === 0) {
      onFocusRowIndexApplied?.();
      return;
    }
    setActiveCell({ rowIndex, colIndex: editableColIndexes[0] });
    onFocusRowIndexApplied?.();
  }, [focusRowIndexAfterDelete, data.length, editableColIndexes, onFocusRowIndexApplied]);

  const visibleRange = useMemo(() => {
    if (!virtualize || data.length === 0) return { start: 0, end: data.length };
    const start = Math.max(0, Math.floor(scrollTop / rowHeight) - OVERSCAN_ROWS);
    const visibleCount = Math.ceil(viewportHeight / rowHeight) + OVERSCAN_ROWS * 2;
    const end = Math.min(data.length, start + visibleCount);
    return { start, end };
  }, [virtualize, data.length, scrollTop, rowHeight, viewportHeight]);

  useEffect(() => {
    if (!virtualize) return;
    const keep = new Set<string>();
    for (let r = visibleRange.start; r < visibleRange.end; r++) {
      for (const ci of editableColIndexes) keep.add(cellKey(r, ci));
    }
    for (const k of inputRefs.current.keys()) {
      if (!keep.has(k)) inputRefs.current.delete(k);
    }
  }, [visibleRange.start, visibleRange.end, editableColIndexes, virtualize]);

  const handleScroll = useCallback(
    (e: React.UIEvent<HTMLDivElement>) => {
      const top = e.currentTarget.scrollTop;
      if (scrollRaf.current != null) return;
      scrollRaf.current = requestAnimationFrame(() => {
        scrollRaf.current = null;
        applyScrollTop(top);
      });
    },
    [applyScrollTop],
  );

  useEffect(
    () => () => {
      if (scrollRaf.current != null) cancelAnimationFrame(scrollRaf.current);
    },
    [],
  );

  const moveCell = useCallback(
    (coord: CellCoord, direction: 'next' | 'prev' | 'up' | 'down' | 'left' | 'right' | 'home' | 'end') => {
      if (editableColIndexes.length === 0 || data.length === 0) return false;

      let { rowIndex, colIndex } = coord;

      if (direction === 'home') {
        setActiveCell({ rowIndex, colIndex: editableColIndexes[0] });
        return true;
      }
      if (direction === 'end') {
        setActiveCell({ rowIndex, colIndex: editableColIndexes[editableColIndexes.length - 1] });
        return true;
      }
      if (direction === 'up' && rowIndex > 0) {
        setActiveCell({ rowIndex: rowIndex - 1, colIndex });
        return true;
      }
      if (direction === 'down' && rowIndex < data.length - 1) {
        setActiveCell({ rowIndex: rowIndex + 1, colIndex });
        return true;
      }

      const colPos = editableColIndexes.indexOf(colIndex);
      if (colPos < 0) {
        setActiveCell({ rowIndex, colIndex: editableColIndexes[0] });
        return true;
      }
      if (direction === 'left' && colPos > 0) {
        setActiveCell({ rowIndex, colIndex: editableColIndexes[colPos - 1] });
        return true;
      }
      if (direction === 'right' && colPos < editableColIndexes.length - 1) {
        setActiveCell({ rowIndex, colIndex: editableColIndexes[colPos + 1] });
        return true;
      }
      if (direction === 'next') {
        if (colPos < editableColIndexes.length - 1) {
          setActiveCell({ rowIndex, colIndex: editableColIndexes[colPos + 1] });
          return true;
        }
        if (rowIndex < data.length - 1) {
          setActiveCell({ rowIndex: rowIndex + 1, colIndex: editableColIndexes[0] });
          return true;
        }
        return false;
      }
      if (colPos > 0) {
        setActiveCell({ rowIndex, colIndex: editableColIndexes[colPos - 1] });
        return true;
      }
      if (rowIndex > 0) {
        setActiveCell({ rowIndex: rowIndex - 1, colIndex: editableColIndexes[editableColIndexes.length - 1] });
        return true;
      }
      return false;
    },
    [data.length, editableColIndexes],
  );

  const onCellKeyDown = useCallback(
    (e: KeyboardEvent, rowIndex: number, colIndex: number) => {
      const coord = { rowIndex, colIndex };
      if (e.key === 'Tab' || e.key === 'Enter') {
        e.preventDefault();
        const moved = moveCell(coord, e.shiftKey ? 'prev' : 'next');
        if (!moved && !e.shiftKey) {
          setActiveCell(null);
          onExitEnd?.();
        }
        return;
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        moveCell(coord, 'up');
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        moveCell(coord, 'down');
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        moveCell(coord, 'left');
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        moveCell(coord, 'right');
      } else if (e.key === 'Home') {
        e.preventDefault();
        moveCell(coord, 'home');
      } else if (e.key === 'End') {
        e.preventDefault();
        moveCell(coord, 'end');
      } else if (e.key === 'Escape') {
        (e.target as HTMLElement).blur();
        setActiveCell(null);
      }
    },
    [moveCell, onExitEnd],
  );

  const onFocusCell = useCallback((rowIndex: number, colIndex: number) => {
    setActiveCell((prev) =>
      prev?.rowIndex === rowIndex && prev.colIndex === colIndex ? prev : { rowIndex, colIndex },
    );
  }, []);

  const gridTemplate = useMemo(
    () => buildGridTemplateColumns(columns as DataGridColumn<unknown>[]),
    [columns],
  );

  const paddingTop = virtualize ? visibleRange.start * rowHeight : 0;
  const paddingBottom = virtualize ? Math.max(0, (data.length - visibleRange.end) * rowHeight) : 0;
  const slice = virtualize ? data.slice(visibleRange.start, visibleRange.end) : data;

  const gridClass = [
    'corporate-data-grid',
    variant === 'so-list' ? 'corporate-data-grid--so-list' : '',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={gridClass} style={{ minHeight }} role="grid" aria-rowcount={data.length}>
      <div
        className="corporate-data-grid__header"
        style={{ gridTemplateColumns: gridTemplate, height: headerHeight }}
        role="row"
      >
        {columns.map((col) => {
          const sortable = sortableColumnIds?.includes(col.id) && onSortColumn;
          const isSorted = sortColumnId === col.id;
          return (
            <div key={col.id} className="corporate-data-grid__header-cell" role="columnheader">
              {sortable ? (
                <button
                  type="button"
                  className={[
                    'corporate-data-grid__sort-header',
                    isSorted ? 'corporate-data-grid__sort-header--active' : '',
                  ]
                    .filter(Boolean)
                    .join(' ')}
                  onClick={() => onSortColumn(col.id)}
                >
                  <span>{col.header}</span>
                  <span className="corporate-data-grid__sort-indicator" aria-hidden>
                    {isSorted ? (sortDir === 'asc' ? ' ▲' : ' ▼') : ' ⇅'}
                  </span>
                </button>
              ) : (
                col.header
              )}
            </div>
          );
        })}
      </div>
      <div
        ref={bodyRef}
        className="corporate-data-grid__body"
        style={{ minHeight: minHeight - headerHeight }}
        onScroll={handleScroll}
      >
        <div className="corporate-data-grid__body-inner" style={{ paddingTop, paddingBottom }}>
          {data.length === 0 && emptyMessage ? (
            <div className="corporate-data-grid__empty" role="status">
              {emptyMessage}
            </div>
          ) : null}
          {slice.map((row, sliceIndex) => {
            const rowIndex = virtualize ? visibleRange.start + sliceIndex : sliceIndex;
            const activeColIndex =
              activeCell?.rowIndex === rowIndex ? activeCell.colIndex : null;
            return (
              <VirtualGridRow
                key={row.id}
                row={row}
                rowIndex={rowIndex}
                columns={columns}
                gridTemplate={gridTemplate}
                rowHeight={rowHeight}
                activeColIndex={activeColIndex}
                variant={variant}
                onRowDoubleClick={onRowDoubleClick}
                onRowClick={onRowClick}
                isSelected={selectedRowId != null && row.id === selectedRowId}
                onCellKeyDown={onCellKeyDown}
                onFocusCell={onFocusCell}
                onRowChange={onRowChange}
                registerInputRef={registerInputRef}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
}

export const CorporateDataGrid = forwardRef(CorporateDataGridInner) as <T extends { id: string }>(
  props: CorporateDataGridProps<T> & { ref?: React.ForwardedRef<CorporateDataGridHandle> },
) => ReturnType<typeof CorporateDataGridInner>;
