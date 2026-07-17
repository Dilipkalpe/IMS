import { useCallback } from 'react';
import { mapSalesOrderToPrintableDocument } from '../mappers/salesOrderPrintMapper';
import type { SalesOrderUiSnapshot } from '../mappers/salesOrderPrintMapper';
import { useDocumentPrintService } from '../context/DocumentPrintContext';
import type { DocumentActionOutcome } from '../contracts/printExportRequests';
import { openDeferredPrintWindow } from '../providers/stubPrintProvider';

export function useSalesOrderPrintActions() {
  const printService = useDocumentPrintService();

  const toPrintable = useCallback((snapshot: SalesOrderUiSnapshot) => {
    return mapSalesOrderToPrintableDocument(snapshot);
  }, []);

  const print = useCallback(
    async (snapshot: SalesOrderUiSnapshot, showDialog = true): Promise<DocumentActionOutcome> => {
      const previewWin = openDeferredPrintWindow();
      if (!previewWin) {
        return { ok: false, message: 'Popup blocked — allow popups for print preview.', kind: 'print' };
      }
      try {
        const doc = toPrintable(snapshot);
        const outcome = await printService.print('sales_order', doc, {
          showDialog,
          targetWindow: previewWin,
        });
        if (!outcome.ok) previewWin.close();
        return outcome;
      } catch (err) {
        previewWin.close();
        return {
          ok: false,
          message: err instanceof Error ? err.message : 'Print failed.',
          kind: 'print',
        };
      }
    },
    [printService, toPrintable],
  );

  const savePrintNext = useCallback(
    async (
      snapshot: SalesOrderUiSnapshot,
      onSave: () => Promise<{ ok: boolean; message?: string }>,
    ): Promise<DocumentActionOutcome> => {
      const doc = toPrintable(snapshot);
      return printService.savePrintNext('sales_order', doc, onSave);
    },
    [printService, toPrintable],
  );

  return { toPrintable, print, savePrintNext };
}
