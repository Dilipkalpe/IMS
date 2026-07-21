import { useCallback } from 'react';
import { mapGrnToPrintableDocument } from '../mappers/grnPrintMapper';
import type { GrnUiSnapshot } from '../mappers/grnPrintMapper';
import { useDocumentPrintService } from '../context/DocumentPrintContext';
import type { DocumentActionOutcome } from '../contracts/printExportRequests';
import { runDocumentPrint } from '../utils/runDocumentPrint';

export function useGrnPrintActions() {
  const printService = useDocumentPrintService();

  const toPrintable = useCallback((snapshot: GrnUiSnapshot) => {
    return mapGrnToPrintableDocument(snapshot);
  }, []);

  const print = useCallback(
    async (snapshot: GrnUiSnapshot, showDialog = true): Promise<DocumentActionOutcome> => {
      const doc = toPrintable(snapshot);
      return runDocumentPrint(printService, 'grn', doc, { showDialog });
    },
    [printService, toPrintable],
  );

  const savePrintNext = useCallback(
    async (
      snapshot: GrnUiSnapshot,
      onSave: () => Promise<{ ok: boolean; message?: string }>,
    ): Promise<DocumentActionOutcome> => {
      const doc = toPrintable(snapshot);
      return printService.savePrintNext('grn', doc, onSave);
    },
    [printService, toPrintable],
  );

  return { toPrintable, print, savePrintNext };
}
