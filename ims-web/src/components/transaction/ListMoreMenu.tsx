import { useCallback, useEffect, useRef, useState } from 'react';
import type { ListExportFormat } from './listExport';
import './ListMoreMenu.scss';

export interface ListMoreMenuProps {
  disabled?: boolean;
  exportBusy?: boolean;
  exportDisabled?: boolean;
  canClearFilters?: boolean;
  onRefresh: () => void;
  onClearFilters: () => void;
  onExport: (format: ListExportFormat) => void;
}

const EXPORT_ITEMS: { format: ListExportFormat; label: string }[] = [
  { format: 'excel', label: 'Excel (CSV)' },
  { format: 'csv', label: 'CSV' },
  { format: 'pdf', label: 'PDF Preview' },
  { format: 'print', label: 'Print' },
];

/** Toolbar "More" dropdown — refresh, clear filters, and export actions. */
export function ListMoreMenu({
  disabled,
  exportBusy,
  exportDisabled,
  canClearFilters,
  onRefresh,
  onClearFilters,
  onExport,
}: ListMoreMenuProps) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  const close = useCallback(() => setOpen(false), []);

  useEffect(() => {
    if (!open) return;
    const onDocClick = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) close();
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close();
    };
    document.addEventListener('mousedown', onDocClick);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDocClick);
      document.removeEventListener('keydown', onKey);
    };
  }, [close, open]);

  return (
    <div className="list-more-menu" ref={rootRef}>
      <button
        type="button"
        className="wpf-action-button list-more-menu__trigger"
        disabled={disabled}
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
      >
        More ▾
      </button>
      {open ? (
        <div className="list-more-menu__popup" role="menu">
          <button
            type="button"
            role="menuitem"
            className="list-more-menu__item"
            disabled={disabled}
            onClick={() => {
              close();
              onRefresh();
            }}
          >
            Refresh
          </button>
          <button
            type="button"
            role="menuitem"
            className="list-more-menu__item"
            disabled={!canClearFilters}
            onClick={() => {
              close();
              onClearFilters();
            }}
          >
            Clear filters
          </button>
          <div className="list-more-menu__divider" role="separator" />
          {EXPORT_ITEMS.map((item) => (
            <button
              key={item.format}
              type="button"
              role="menuitem"
              className="list-more-menu__item"
              disabled={exportDisabled || exportBusy}
              onClick={() => {
                close();
                onExport(item.format);
              }}
            >
              {exportBusy ? 'Exporting…' : item.label}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
