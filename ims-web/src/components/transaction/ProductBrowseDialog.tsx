import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { fetchProductsPage, type SalesProductInfo } from '../../api/products';
import { LoadingHost } from '../loading';

const PAGE_SIZES = [10, 25, 50, 100] as const;
const SEARCH_DELAY_MS = 350;

export interface ProductBrowseDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: (products: SalesProductInfo[]) => void;
}

interface BrowseRow extends SalesProductInfo {
  rowKey: string;
}

export function ProductBrowseDialog({ open, onClose, onConfirm }: ProductBrowseDialogProps) {
  const [searchText, setSearchText] = useState('');
  const [rows, setRows] = useState<BrowseRow[]>([]);
  const [selectedByCode, setSelectedByCode] = useState<Map<string, SalesProductInfo>>(() => new Map());
  const [isMultiSelect, setIsMultiSelect] = useState(true);
  const [highlightCode, setHighlightCode] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState<number>(25);
  const [totalRecords, setTotalRecords] = useState(0);
  const [isBusy, setIsBusy] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const [source, setSource] = useState<'api' | 'offline'>('api');
  const searchCts = useRef<AbortController | null>(null);

  const totalPages = Math.max(1, Math.ceil(totalRecords / pageSize) || 1);
  const selectedCount = selectedByCode.size;

  const selectionHelpText = isMultiSelect
    ? 'Check products on any page, then click Add selected. Selections are kept when you change pages.'
    : 'Click a row and Select, or double-click a row to add one product.';

  const selectButtonText = isMultiSelect
    ? selectedCount > 0
      ? `Add selected (${selectedCount})`
      : 'Add selected'
    : 'Select';

  const resetDialog = useCallback(() => {
    setSearchText('');
    setRows([]);
    setSelectedByCode(new Map());
    setIsMultiSelect(true);
    setHighlightCode(null);
    setCurrentPage(1);
    setPageSize(25);
    setTotalRecords(0);
    setStatusMessage('');
    setSource('api');
  }, []);

  const loadPage = useCallback(async (term: string, page: number, limit: number) => {
    searchCts.current?.abort();
    const ac = new AbortController();
    searchCts.current = ac;
    setIsBusy(true);

    try {
      const trimmed = term.trim();
      const result = await fetchProductsPage({
        page,
        limit,
        search: trimmed || undefined,
      });

      if (ac.signal.aborted) return;

      setRows(
        result.items.map((p) => ({
          ...p,
          rowKey: p.code,
        })),
      );
      setTotalRecords(result.total);
      setSource(result.page != null ? 'api' : 'offline');
      setStatusMessage(
        result.items.length > 0
          ? `Showing ${result.items.length} product(s)${trimmed ? ` for "${trimmed}"` : ''}.`
          : trimmed
            ? 'No products found — try code or name.'
            : 'No products in catalog.',
      );
    } catch {
      if (ac.signal.aborted) return;
      setRows([]);
      setTotalRecords(0);
      setStatusMessage('Could not load products — try again.');
    } finally {
      if (!ac.signal.aborted) setIsBusy(false);
    }
  }, []);

  useEffect(() => {
    if (!open) return;
    resetDialog();
  }, [open, resetDialog]);

  useEffect(() => {
    if (!open) return;

    const timer = window.setTimeout(() => {
      void loadPage(searchText, currentPage, pageSize);
    }, SEARCH_DELAY_MS);

    return () => window.clearTimeout(timer);
  }, [open, searchText, currentPage, pageSize, loadPage]);

  const toggleRow = useCallback(
    (product: SalesProductInfo, checked: boolean) => {
      if (!isMultiSelect) {
        setHighlightCode(product.code);
        setSelectedByCode(new Map([[product.code, product]]));
        return;
      }

      setSelectedByCode((prev) => {
        const next = new Map(prev);
        if (checked) next.set(product.code, product);
        else next.delete(product.code);
        return next;
      });
    },
    [isMultiSelect],
  );

  const selectAllOnPage = useCallback(() => {
    if (!isMultiSelect) return;
    setSelectedByCode((prev) => {
      const next = new Map(prev);
      for (const row of rows) next.set(row.code, row);
      return next;
    });
  }, [isMultiSelect, rows]);

  const clearSelection = useCallback(() => {
    setSelectedByCode(new Map());
    setHighlightCode(null);
  }, []);

  const confirmSelect = useCallback(() => {
    const products = isMultiSelect
      ? Array.from(selectedByCode.values())
      : highlightCode && selectedByCode.has(highlightCode)
        ? [selectedByCode.get(highlightCode)!]
        : [];

    if (!products.length) return;
    onConfirm(products);
    onClose();
  }, [highlightCode, isMultiSelect, onClose, onConfirm, selectedByCode]);

  const handleRowDoubleClick = useCallback(
    (product: SalesProductInfo) => {
      onConfirm([product]);
      onClose();
    },
    [onClose, onConfirm],
  );

  const pageLabel = useMemo(
    () => `Page ${currentPage} of ${totalPages} (${totalRecords.toLocaleString()} total)`,
    [currentPage, totalPages, totalRecords],
  );

  if (!open) return null;

  return (
    <div className="si-product-browse-overlay" role="presentation" onClick={onClose}>
      <div
        className="si-product-browse"
        role="dialog"
        aria-modal="true"
        aria-labelledby="si-product-browse-title"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 id="si-product-browse-title" className="si-product-browse__title">
          Browse products
        </h2>
        <p className="si-product-browse__help">{selectionHelpText}</p>

        <div className="si-product-browse__mode">
          <label className="si-product-browse__radio">
            <input
              type="radio"
              name="browse-mode"
              checked={!isMultiSelect}
              onChange={() => {
                setIsMultiSelect(false);
                clearSelection();
              }}
            />
            Single select
          </label>
          <label className="si-product-browse__radio">
            <input
              type="radio"
              name="browse-mode"
              checked={isMultiSelect}
              onChange={() => setIsMultiSelect(true)}
            />
            Multi select
          </label>
          {isMultiSelect && (
            <span className="si-product-browse__selected-count">
              {selectedCount} selected
            </span>
          )}
        </div>

        <div className="si-product-browse__toolbar">
          <input
            type="search"
            className="wpf-sales-compact-input si-product-browse__search"
            placeholder="Search code or name (2+ characters)"
            value={searchText}
            onChange={(e) => {
              setSearchText(e.target.value);
              setCurrentPage(1);
            }}
            aria-label="Search products"
          />
          <button
            type="button"
            className="wpf-secondary-button"
            disabled={isBusy}
            onClick={() => void loadPage(searchText, currentPage, pageSize)}
          >
            Search
          </button>
          {isMultiSelect && (
            <>
              <button
                type="button"
                className="wpf-secondary-button"
                disabled={isBusy || rows.length === 0}
                onClick={selectAllOnPage}
              >
                All on page
              </button>
              <button
                type="button"
                className="wpf-secondary-button"
                disabled={selectedCount === 0}
                onClick={clearSelection}
              >
                Clear
              </button>
            </>
          )}
        </div>

        <LoadingHost
          loading={isBusy}
          title="Loading products…"
          subtitle="Please wait while data is retrieved"
          className="si-product-browse__grid-wrap"
        >
          <table className="si-product-browse__grid">
            <thead>
              <tr>
                {isMultiSelect && <th className="si-product-browse__col-check" />}
                <th>Code</th>
                <th>Name</th>
                <th className="si-product-browse__col-num">Sale rate</th>
                <th className="si-product-browse__col-num">Tax %</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => {
                const checked = selectedByCode.has(row.code);
                const highlighted = highlightCode === row.code;
                return (
                  <tr
                    key={row.rowKey}
                    className={highlighted ? 'si-product-browse__row--active' : undefined}
                    onClick={() => {
                      if (!isMultiSelect) toggleRow(row, true);
                    }}
                    onDoubleClick={() => handleRowDoubleClick(row)}
                  >
                    {isMultiSelect && (
                      <td className="si-product-browse__col-check">
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={(e) => toggleRow(row, e.target.checked)}
                          onClick={(e) => e.stopPropagation()}
                          aria-label={`Select ${row.code}`}
                        />
                      </td>
                    )}
                    <td>{row.code}</td>
                    <td>{row.name}</td>
                    <td className="si-product-browse__col-num">{row.rate.toFixed(2)}</td>
                    <td className="si-product-browse__col-num">{row.taxPercent}</td>
                  </tr>
                );
              })}
              {!isBusy && rows.length === 0 && (
                <tr>
                  <td colSpan={isMultiSelect ? 5 : 4} className="si-product-browse__empty">
                    No products to show.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </LoadingHost>

        <div className="si-product-browse__pagination">
          <label>
            Page size
            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setCurrentPage(1);
              }}
              disabled={isBusy}
            >
              {PAGE_SIZES.map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
          </label>
          <span>{pageLabel}</span>
          <button
            type="button"
            className="wpf-secondary-button"
            disabled={currentPage <= 1 || isBusy}
            onClick={() => setCurrentPage(1)}
          >
            First
          </button>
          <button
            type="button"
            className="wpf-secondary-button"
            disabled={currentPage <= 1 || isBusy}
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
          >
            Prev
          </button>
          <button
            type="button"
            className="wpf-secondary-button"
            disabled={currentPage >= totalPages || isBusy}
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
          >
            Next
          </button>
          <button
            type="button"
            className="wpf-secondary-button"
            disabled={currentPage >= totalPages || isBusy}
            onClick={() => setCurrentPage(totalPages)}
          >
            Last
          </button>
        </div>

        <div className="si-product-browse__footer">
          <div className="si-product-browse__actions">
            <button
              type="button"
              className="wpf-primary-button"
              disabled={
                isMultiSelect ? selectedCount === 0 : !highlightCode || !selectedByCode.has(highlightCode)
              }
              onClick={confirmSelect}
            >
              {selectButtonText}
            </button>
            <button type="button" className="wpf-secondary-button" onClick={onClose}>
              Cancel
            </button>
          </div>
          <p className="si-product-browse__status">
            {statusMessage}
            {source === 'offline' ? ' · sample catalog (API offline)' : ''}
          </p>
        </div>
      </div>
    </div>
  );
}
