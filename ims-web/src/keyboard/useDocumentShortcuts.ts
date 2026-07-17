import { useEffect } from 'react';

export interface DocumentShortcutHandlers {
  onCancel?: () => void;
  onSaveAndNext?: () => void;
  onSavePrintNext?: () => void;
  onSave?: () => void;
  enabled?: boolean;
}

function isEditableTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  const tag = target.tagName;
  if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return true;
  return target.isContentEditable;
}

/** F7 / Esc / F11 / F12 — matches SalesInvoiceEntryView InputBindings. */
export function useDocumentShortcuts({
  onCancel,
  onSaveAndNext,
  onSavePrintNext,
  onSave,
  enabled = true,
}: DocumentShortcutHandlers) {
  useEffect(() => {
    if (!enabled) return;

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && onCancel) {
        if (isEditableTarget(e.target)) return;
        e.preventDefault();
        onCancel();
        return;
      }
      if (e.altKey || e.ctrlKey || e.metaKey) return;
      if (e.key === 'F7') {
        e.preventDefault();
        onCancel?.();
      } else if (e.key === 'F11') {
        e.preventDefault();
        onSaveAndNext?.();
      } else if (e.key === 'F12') {
        e.preventDefault();
        onSavePrintNext?.();
      } else if (e.key === 'F9' && onSave) {
        e.preventDefault();
        onSave?.();
      }
    };

    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [enabled, onCancel, onSaveAndNext, onSavePrintNext, onSave]);
}
