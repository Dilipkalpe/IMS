import { useCallback } from 'react';
import { mapPurchaseInvoiceToPrintableDocument } from '../mappers/purchaseInvoicePrintMapper';
import type { PurchaseInvoiceUiSnapshot } from '../mappers/purchaseInvoicePrintMapper';
import { useDocumentPrintService } from '../context/DocumentPrintContext';
import type { DocumentActionOutcome } from '../contracts/printExportRequests';
import { runDocumentPrint } from '../utils/runDocumentPrint';

export function usePurchaseInvoicePrintActions() {
  const printService = useDocumentPrintService();

  const toPrintable = useCallback((snapshot: PurchaseInvoiceUiSnapshot) => {
    return mapPurchaseInvoiceToPrintableDocument(snapshot);
  }, []);

  const print = useCallback(
    async (snapshot: PurchaseInvoiceUiSnapshot, showDialog = true): Promise<DocumentActionOutcome> => {
      const doc = toPrintable(snapshot);
      return runDocumentPrint(printService, 'purchase_invoice', doc, { showDialog });
    },
    [printService, toPrintable],
  );

  const savePrintNext = useCallback(
    async (
      snapshot: PurchaseInvoiceUiSnapshot,
      onSave: () => Promise<{ ok: boolean; message?: string }>,
    ): Promise<DocumentActionOutcome> => {
      const doc = toPrintable(snapshot);
      return printService.savePrintNext('purchase_invoice', doc, onSave);
    },
    [printService, toPrintable],
  );

  return { toPrintable, print, savePrintNext };
}
