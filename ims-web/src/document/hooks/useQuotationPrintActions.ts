import { useCallback } from 'react';
import { mapQuotationToPrintableDocument } from '../mappers/quotationPrintMapper';
import type { QuotationUiSnapshot } from '../mappers/quotationPrintMapper';
import { useDocumentPrintService } from '../context/DocumentPrintContext';
import type { DocumentActionOutcome } from '../contracts/printExportRequests';
import { runDocumentPrint } from '../utils/runDocumentPrint';

export function useQuotationPrintActions() {
  const printService = useDocumentPrintService();

  const toPrintable = useCallback((snapshot: QuotationUiSnapshot) => {
    return mapQuotationToPrintableDocument(snapshot);
  }, []);

  const print = useCallback(
    async (snapshot: QuotationUiSnapshot, showDialog = true): Promise<DocumentActionOutcome> => {
      const doc = toPrintable(snapshot);
      return runDocumentPrint(printService, 'quotation', doc, { showDialog });
    },
    [printService, toPrintable],
  );

  const savePrintNext = useCallback(
    async (
      snapshot: QuotationUiSnapshot,
      onSave: () => Promise<{ ok: boolean; message?: string }>,
    ): Promise<DocumentActionOutcome> => {
      const doc = toPrintable(snapshot);
      return printService.savePrintNext('quotation', doc, onSave);
    },
    [printService, toPrintable],
  );

  return { toPrintable, print, savePrintNext };
}
