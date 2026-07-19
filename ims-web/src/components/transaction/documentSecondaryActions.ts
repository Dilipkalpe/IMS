import {
  getPrintPreviousSnapshot,
  hasPrintPreviousSnapshot,
  registerPrintPreviousSnapshot,
} from './printPreviousRegistry';
import { promptDocumentSearch } from './documentSearchPrompt';

export { registerPrintPreviousSnapshot, hasPrintPreviousSnapshot };

export interface DocumentSecondaryActionOptions<TSnapshot> {
  moduleKey: string;
  setStatus: (message: string | null) => void;
  getUiSnapshot: () => TSnapshot;
  printSnapshot: (snapshot: TSnapshot, showDialog?: boolean) => Promise<{ ok: boolean; message?: string }>;
  openByFormatted: (formatted: string) => Promise<void>;
  duplicateToNewTab?: () => Promise<void>;
  currentFormatted?: () => string | undefined;
}

export async function handleDocumentSecondaryAction<TSnapshot>(
  label: string,
  options: DocumentSecondaryActionOptions<TSnapshot>,
): Promise<boolean> {
  if (label === 'Print Previous' || label === 'Print Prev') {
    if (!hasPrintPreviousSnapshot(options.moduleKey)) {
      options.setStatus('No previous document has been printed yet.');
      return true;
    }
    const snapshot = getPrintPreviousSnapshot<TSnapshot>(options.moduleKey);
    if (!snapshot) {
      options.setStatus('No previous document has been printed yet.');
      return true;
    }
    const outcome = await options.printSnapshot(snapshot, true);
    options.setStatus(outcome.message ?? (outcome.ok ? 'Printed previous document.' : 'Print failed.'));
    return true;
  }

  if (label === 'Search (F9)' || label === 'Search') {
    const formatted = promptDocumentSearch(options.currentFormatted?.());
    if (!formatted) return true;
    try {
      await options.openByFormatted(formatted);
      options.setStatus(`Opened ${formatted}.`);
    } catch (err) {
      options.setStatus(err instanceof Error ? err.message : 'Document not found.');
    }
    return true;
  }

  if (label === 'Duplicate') {
    if (!options.duplicateToNewTab) {
      options.setStatus('Duplicate is not available for this document type.');
      return true;
    }
    try {
      await options.duplicateToNewTab();
      options.setStatus('Duplicated to new tab — review and save.');
    } catch (err) {
      options.setStatus(err instanceof Error ? err.message : 'Duplicate failed.');
    }
    return true;
  }

  return false;
}
