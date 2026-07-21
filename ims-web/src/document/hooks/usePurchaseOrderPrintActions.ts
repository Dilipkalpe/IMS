import { useCallback } from 'react';
import { mapPurchaseOrderToPrintableDocument } from '../mappers/purchaseOrderPrintMapper';
import type { PurchaseOrderUiSnapshot } from '../mappers/purchaseOrderPrintMapper';
import { useDocumentPrintService } from '../context/DocumentPrintContext';
import type { DocumentActionOutcome } from '../contracts/printExportRequests';
import { runDocumentPrint } from '../utils/runDocumentPrint';

export function usePurchaseOrderPrintActions() {
  const printService = useDocumentPrintService();

  const toPrintable = useCallback((snapshot: PurchaseOrderUiSnapshot) => {
    return mapPurchaseOrderToPrintableDocument(snapshot);
  }, []);

  const print = useCallback(
    async (snapshot: PurchaseOrderUiSnapshot, showDialog = true): Promise<DocumentActionOutcome> => {
      const doc = toPrintable(snapshot);
      return runDocumentPrint(printService, 'purchase_order', doc, { showDialog });
    },
    [printService, toPrintable],
  );

  const savePrintNext = useCallback(
    async (
      snapshot: PurchaseOrderUiSnapshot,
      onSave: () => Promise<{ ok: boolean; message?: string }>,
    ): Promise<DocumentActionOutcome> => {
      const doc = toPrintable(snapshot);
      return printService.savePrintNext('purchase_order', doc, onSave);
    },
    [printService, toPrintable],
  );

  return { toPrintable, print, savePrintNext };
}
