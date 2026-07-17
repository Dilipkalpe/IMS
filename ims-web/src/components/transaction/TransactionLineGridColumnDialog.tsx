import { useCallback, useEffect, useMemo, useState } from 'react';
import type { GridColumnDefinition } from '../../api/gridColumns';
import {
  getDefaultVisibleLineGridKeys,
  normalizeVisibleLineGridKeys,
  type TransactionLineGridModuleKey,
} from './transactionLineGridColumns';

export interface TransactionLineGridColumnDialogProps {
  open: boolean;
  moduleKey: TransactionLineGridModuleKey;
  moduleTitle: string;
  columns: GridColumnDefinition[];
  visibleKeys: readonly string[];
  isBusy?: boolean;
  onClose: () => void;
  onApply: (visibleKeys: string[]) => void | Promise<void>;
}

export function TransactionLineGridColumnDialog({
  open,
  moduleKey,
  moduleTitle,
  columns,
  visibleKeys,
  isBusy = false,
  onClose,
  onApply,
}: TransactionLineGridColumnDialogProps) {
  const [draftVisible, setDraftVisible] = useState<Set<string>>(() => new Set(visibleKeys));
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setDraftVisible(new Set(visibleKeys));
  }, [open, visibleKeys]);

  const defaultKeys = useMemo(() => getDefaultVisibleLineGridKeys(moduleKey), [moduleKey]);

  const toggleKey = useCallback((key: string, checked: boolean, mandatory: boolean) => {
    if (mandatory) return;
    setDraftVisible((prev) => {
      const next = new Set(prev);
      if (checked) next.add(key);
      else next.delete(key);
      return next;
    });
  }, []);

  const handleReset = useCallback(() => {
    setDraftVisible(new Set(defaultKeys));
  }, [defaultKeys]);

  const handleApply = useCallback(async () => {
    setSaving(true);
    try {
      const keys = normalizeVisibleLineGridKeys(Array.from(draftVisible), moduleKey);
      await onApply(keys);
    } finally {
      setSaving(false);
    }
  }, [draftVisible, moduleKey, onApply]);

  if (!open) return null;

  const busy = isBusy || saving;

  return (
    <div className="si-grid-columns-overlay" role="presentation" onClick={onClose}>
      <div
        className="si-grid-columns-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="si-grid-columns-title"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 id="si-grid-columns-title" className="si-grid-columns-dialog__title">
          Manage columns — {moduleTitle}
        </h2>
        <p className="si-grid-columns-dialog__help">Show / hide line item columns</p>

        <div className="si-grid-columns-dialog__list">
          {columns.map((col) => {
            const checked = col.mandatory || draftVisible.has(col.key);
            return (
              <label key={col.key} className="si-grid-columns-dialog__item">
                <input
                  type="checkbox"
                  checked={checked}
                  disabled={col.mandatory || busy}
                  onChange={(e) => toggleKey(col.key, e.target.checked, col.mandatory)}
                />
                <span>{col.header}</span>
                {col.mandatory ? (
                  <span className="si-grid-columns-dialog__mandatory">Required</span>
                ) : null}
              </label>
            );
          })}
        </div>

        <div className="si-grid-columns-dialog__actions">
          <button
            type="button"
            className="wpf-secondary-button"
            disabled={busy}
            onClick={handleReset}
          >
            Reset
          </button>
          <button type="button" className="wpf-secondary-button" disabled={busy} onClick={onClose}>
            Cancel
          </button>
          <button
            type="button"
            className="wpf-action-button"
            disabled={busy}
            onClick={() => void handleApply()}
          >
            Apply
          </button>
        </div>
      </div>
    </div>
  );
}
