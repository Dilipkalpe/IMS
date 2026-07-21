import { useCallback, useEffect, useRef, useState } from 'react';
import { ListExportMenu } from '../components/transaction/ListExportMenu';
import type { ListExportFormat } from '../components/transaction/listExport';
import { FIELD_FOCUS_KEY } from '../keyboard/formKeyboardNavigation';
import './SalesListToolbar.scss';

export interface SalesListToolbarProps {
  searchPlaceholder: string;
  searchValue: string;
  onSearchChange: (value: string) => void;
  statusFilter: string;
  statusOptions: string[];
  onStatusFilterChange: (value: string) => void;
  onRefresh: () => void;
  onClearFilters: () => void;
  hasActiveFilters: boolean;
  loading?: boolean;
  canAdd: boolean;
  onAddNew: () => void;
  addNewTitle?: string;
  exportDisabled?: boolean;
  exportBusy?: boolean;
  onExport: (format: ListExportFormat) => void;
  statusMessage?: string;
}

export function SalesListToolbar({
  searchPlaceholder,
  searchValue,
  onSearchChange,
  statusFilter,
  statusOptions,
  onStatusFilterChange,
  onRefresh,
  onClearFilters,
  hasActiveFilters,
  loading = false,
  canAdd,
  onAddNew,
  addNewTitle = 'Add new (Ctrl+N)',
  exportDisabled,
  exportBusy,
  onExport,
  statusMessage,
}: SalesListToolbarProps) {
  const [filtersOpen, setFiltersOpen] = useState(false);
  const filtersRef = useRef<HTMLDivElement>(null);

  const closeFilters = useCallback(() => setFiltersOpen(false), []);

  useEffect(() => {
    if (!filtersOpen) return;
    const onDocClick = (e: MouseEvent) => {
      if (!filtersRef.current?.contains(e.target as Node)) closeFilters();
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeFilters();
    };
    document.addEventListener('mousedown', onDocClick);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDocClick);
      document.removeEventListener('keydown', onKey);
    };
  }, [closeFilters, filtersOpen]);

  return (
    <div className="sales-list-toolbar">
      <div className="sales-list-toolbar__row">
        <div className="sales-list-toolbar__filters" ref={filtersRef}>
          <button
            type="button"
            className="sales-list-toolbar__filters-btn"
            aria-haspopup="menu"
            aria-expanded={filtersOpen}
            onClick={() => setFiltersOpen((open) => !open)}
          >
            <span className="icon-text sales-list-toolbar__filters-icon" aria-hidden>
              {'\uE71C'}
            </span>
            Filters
            <span className="sales-list-toolbar__chevron" aria-hidden>
              {'\uE70D'}
            </span>
          </button>
          {filtersOpen ? (
            <div className="sales-list-toolbar__filters-panel" role="menu">
              <label className="sales-list-toolbar__filters-field">
                Status
                <select
                  className="wpf-form-combo"
                  value={statusFilter}
                  onChange={(e) => onStatusFilterChange(e.target.value)}
                  aria-label="Status filter"
                >
                  {statusOptions.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </label>
              <div className="sales-list-toolbar__filters-actions">
                <button
                  type="button"
                  className="wpf-secondary-button"
                  disabled={loading}
                  onClick={() => {
                    void onRefresh();
                    closeFilters();
                  }}
                >
                  Refresh
                </button>
                <button
                  type="button"
                  className="wpf-secondary-button"
                  disabled={!hasActiveFilters}
                  onClick={() => {
                    onClearFilters();
                    closeFilters();
                  }}
                >
                  Clear filters
                </button>
              </div>
            </div>
          ) : null}
        </div>

        <div className="sales-list-toolbar__search-wrap">
          <input
            className="wpf-form-input sales-list-toolbar__search"
            {...{ [FIELD_FOCUS_KEY]: 'list-search' }}
            placeholder={searchPlaceholder}
            value={searchValue}
            onChange={(e) => onSearchChange(e.target.value)}
            aria-label={searchPlaceholder}
          />
          <span className="icon-text sales-list-toolbar__search-icon" aria-hidden>
            {'\uE721'}
          </span>
        </div>

        <button
          type="button"
          className="sales-list-toolbar__add-btn"
          {...{ [FIELD_FOCUS_KEY]: 'list-new' }}
          title={addNewTitle}
          onClick={() => void onAddNew()}
          disabled={!canAdd}
        >
          + Add New
        </button>

        <ListExportMenu
          buttonLabel="More"
          buttonClassName="sales-list-toolbar__more-btn"
          showChevron
          disabled={exportDisabled}
          busy={exportBusy}
          onExport={onExport}
        />
      </div>
      {statusMessage ? (
        <p className="sales-list-toolbar__status" role="status">
          {statusMessage}
        </p>
      ) : null}
    </div>
  );
}
