import { useCallback } from 'react';
import { mapSalesReturnToPrintableDocument } from '../mappers/salesReturnPrintMapper';
import type { SalesReturnUiSnapshot } from '../mappers/salesReturnPrintMapper';
import { useDocumentPrintService } from '../context/DocumentPrintContext';
import type { DocumentActionOutcome } from '../contracts/printExportRequests';
import { runDocumentPrint } from '../utils/runDocumentPrint';

export function useSalesReturnPrintActions() {
  const printService = useDocumentPrintService();

  const toPrintable = useCallback((snapshot: SalesReturnUiSnapshot) => {
    return mapSalesReturnToPrintableDocument(snapshot);
  }, []);

  const print = useCallback(
    async (snapshot: SalesReturnUiSnapshot, showDialog = true): Promise<DocumentActionOutcome> => {
      const doc = toPrintable(snapshot);
      return runDocumentPrint(printService, 'sales_return', doc, { showDialog });
    },
    [printService, toPrintable],
  );

  const savePrintNext = useCallback(
    async (
      snapshot: SalesReturnUiSnapshot,
      onSave: () => Promise<{ ok: boolean; message?: string }>,
    ): Promise<DocumentActionOutcome> => {
      const doc = toPrintable(snapshot);
      return printService.savePrintNext('sales_return', doc, onSave);
    },
    [printService, toPrintable],
  );

  return { toPrintable, print, savePrintNext };
}
