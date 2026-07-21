import { useCallback } from 'react';
import {
  mapPurchaseReturnToPrintableDocument,
  type PurchaseReturnUiSnapshot,
} from '../mappers/purchaseReturnPrintMapper';
import { useDocumentPrintService } from '../context/DocumentPrintContext';
import type { DocumentActionOutcome } from '../contracts/printExportRequests';
import { runDocumentPrint } from '../utils/runDocumentPrint';

export function usePurchaseReturnPrintActions() {
  const printService = useDocumentPrintService();

  const toPrintable = useCallback((snapshot: PurchaseReturnUiSnapshot) => {
    return mapPurchaseReturnToPrintableDocument(snapshot);
  }, []);

  const print = useCallback(
    async (snapshot: PurchaseReturnUiSnapshot, showDialog = true): Promise<DocumentActionOutcome> => {
      const doc = toPrintable(snapshot);
      return runDocumentPrint(printService, 'purchase_return', doc, { showDialog });
    },
    [printService, toPrintable],
  );

  const savePrintNext = useCallback(
    async (
      snapshot: PurchaseReturnUiSnapshot,
      onSave: () => Promise<{ ok: boolean; message?: string }>,
    ): Promise<DocumentActionOutcome> => {
      const doc = toPrintable(snapshot);
      return printService.savePrintNext('purchase_return', doc, onSave);
    },
    [printService, toPrintable],
  );

  return { toPrintable, print, savePrintNext };
}
