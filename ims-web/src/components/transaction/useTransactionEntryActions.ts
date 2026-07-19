import { useCallback, useMemo, type RefObject } from 'react';
import {
  buildDocumentEntryActions,
  type DocumentEntryActionDef,
} from './DocumentEntryActionRail';
import {
  handleDocumentSecondaryAction,
  registerPrintPreviousSnapshot,
} from './documentSecondaryActions';

export interface TransactionEntryActionsConfig<TSnapshot> {
  moduleKey: string;
  tabId: string;
  saveButtonRef: RefObject<HTMLButtonElement | null>;
  isSaving: boolean;
  isLoading: boolean;
  header: { entryDocPrefix?: string; billNo?: string };
  validateDocument: () => { ok: boolean; firstField?: string };
  getUiSnapshot: () => TSnapshot;
  setStatus: (message: string | null) => void;
  save: () => Promise<{ ok: boolean; message?: string }>;
  tryAction: (label: string) => Promise<{ ok: boolean; firstField?: string; remainingTabs?: number }>;
  print: (snapshot: TSnapshot, showDialog?: boolean) => Promise<{ ok: boolean; message?: string }>;
  savePrintNext: (
    snapshot: TSnapshot,
    onSave: () => Promise<{ ok: boolean; message?: string }>,
  ) => Promise<{ ok: boolean; message?: string }>;
  onAfterSavePrintNext: () => Promise<void>;
  openByFormatted: (formatted: string) => Promise<void>;
  duplicateToNewTab?: () => Promise<void>;
  onClose: () => void;
  requestClose: () => boolean;
  focusValidationError: (firstField?: string) => void;
  onSaveFocus?: () => void;
  onNewBillFocus?: () => void;
  extraActions?: DocumentEntryActionDef[];
}

export function useTransactionEntryActions<TSnapshot>(config: TransactionEntryActionsConfig<TSnapshot>) {
  const formattedDocNo = useCallback(() => {
    const prefix = config.header.entryDocPrefix?.trim();
    const no = config.header.billNo?.trim();
    if (!prefix || !no) return undefined;
    return `${prefix}-${no}`;
  }, [config.header.billNo, config.header.entryDocPrefix]);

  const runPrintFlow = useCallback(
    async (label: 'Print' | 'Save, Print, Next (F12)') => {
      const v = config.validateDocument();
      if (!v.ok) {
        requestAnimationFrame(() => config.focusValidationError(v.firstField));
        return;
      }
      const snapshot = config.getUiSnapshot();
      if (label === 'Print') {
        const outcome = await config.print(snapshot, true);
        if (outcome.ok) registerPrintPreviousSnapshot(config.moduleKey, snapshot);
        config.setStatus(outcome.message ?? null);
        return;
      }
      const outcome = await config.savePrintNext(snapshot, async () => {
        const saved = await config.save();
        return { ok: saved.ok, message: saved.message ?? (saved.ok ? 'Saved.' : 'Save failed.') };
      });
      if (outcome.ok) registerPrintPreviousSnapshot(config.moduleKey, snapshot);
      config.setStatus(outcome.message ?? null);
      if (outcome.ok) {
        await config.onAfterSavePrintNext();
        config.onSaveFocus?.();
      }
    },
    [config],
  );

  const runAction = useCallback(
    async (label: string) => {
      if (label === 'Close' || label === 'Cancel') {
        if (!config.requestClose()) return;
        config.onClose();
        return;
      }
      if (label === 'Print' || label === 'Save, Print, Next (F12)') {
        await runPrintFlow(label);
        return;
      }
      const handled = await handleDocumentSecondaryAction(label, {
        moduleKey: config.moduleKey,
        setStatus: config.setStatus,
        getUiSnapshot: config.getUiSnapshot,
        printSnapshot: config.print,
        openByFormatted: config.openByFormatted,
        duplicateToNewTab: config.duplicateToNewTab,
        currentFormatted: formattedDocNo,
      });
      if (handled) return;

      const result = await config.tryAction(label);
      if (!result.ok) {
        requestAnimationFrame(() => config.focusValidationError(result.firstField));
        return;
      }
      if (label === 'Save' && result.remainingTabs === 0) {
        config.onClose();
        return;
      }
      if (label === 'Save' || label === 'Save, Next (F11)') {
        config.onSaveFocus?.();
      }
      if (label === 'New Bill') {
        config.onNewBillFocus?.();
      }
    },
    [config, formattedDocNo, runPrintFlow],
  );

  const entryActions = useMemo(
    () =>
      buildDocumentEntryActions({
        saveButtonRef: config.saveButtonRef,
        disabled: config.isSaving || config.isLoading,
        extraActions: config.extraActions,
      }),
    [config.extraActions, config.isLoading, config.isSaving, config.saveButtonRef],
  );

  return { runAction, runPrintFlow, entryActions };
}
