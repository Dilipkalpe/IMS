import { useCallback } from 'react';
import { mapDeliveryChallanToPrintableDocument } from '../mappers/deliveryChallanPrintMapper';
import type { DeliveryChallanUiSnapshot } from '../mappers/deliveryChallanPrintMapper';
import { useDocumentPrintService } from '../context/DocumentPrintContext';
import type { DocumentActionOutcome } from '../contracts/printExportRequests';

export function useDeliveryChallanPrintActions() {
  const printService = useDocumentPrintService();

  const toPrintable = useCallback((snapshot: DeliveryChallanUiSnapshot) => {
    return mapDeliveryChallanToPrintableDocument(snapshot);
  }, []);

  const print = useCallback(
    async (snapshot: DeliveryChallanUiSnapshot, showDialog = true): Promise<DocumentActionOutcome> => {
      const doc = toPrintable(snapshot);
      return printService.print('delivery_challan', doc, { showDialog });
    },
    [printService, toPrintable],
  );

  const savePrintNext = useCallback(
    async (
      snapshot: DeliveryChallanUiSnapshot,
      onSave: () => Promise<{ ok: boolean; message?: string }>,
    ): Promise<DocumentActionOutcome> => {
      const doc = toPrintable(snapshot);
      return printService.savePrintNext('delivery_challan', doc, onSave);
    },
    [printService, toPrintable],
  );

  return { toPrintable, print, savePrintNext };
}
