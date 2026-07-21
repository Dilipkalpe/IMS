import { useCallback, useEffect, useRef, useState } from 'react';
import type { ListExportFormat } from './listExport';
import './ListExportMenu.scss';

const MENU_ITEMS: { format: ListExportFormat; label: string }[] = [
  { format: 'excel', label: 'Excel (CSV)' },
  { format: 'csv', label: 'CSV' },
  { format: 'pdf', label: 'PDF Preview' },
  { format: 'print', label: 'Print' },
];

export interface ListExportMenuProps {
  disabled?: boolean;
  busy?: boolean;
  onExport: (format: ListExportFormat) => void;
  buttonLabel?: string;
  buttonClassName?: string;
  showChevron?: boolean;
}

/** WPF StandardListView export popup — Excel / CSV / PDF / Print. */
export function ListExportMenu({
  disabled,
  busy,
  onExport,
  buttonLabel = 'Export Data',
  buttonClassName,
  showChevron = false,
}: ListExportMenuProps) {
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
    <div className="list-export-menu" ref={rootRef}>
      <button
        type="button"
        className={['wpf-action-button', buttonClassName].filter(Boolean).join(' ')}
        disabled={disabled || busy}
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
      >
        {busy ? 'Exporting…' : buttonLabel}
        {showChevron && !busy ? <span aria-hidden> ▾</span> : null}
      </button>
      {open ? (
        <div className="list-export-menu__popup" role="menu">
          {MENU_ITEMS.map((item) => (
            <button
              key={item.format}
              type="button"
              role="menuitem"
              className="list-export-menu__item"
              disabled={disabled || busy}
              onClick={() => {
                close();
                onExport(item.format);
              }}
            >
              {item.label}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
