import { useCallback } from 'react';
import { mapSalesOrderToPrintableDocument } from '../mappers/salesOrderPrintMapper';
import type { SalesOrderUiSnapshot } from '../mappers/salesOrderPrintMapper';
import { useDocumentPrintService } from '../context/DocumentPrintContext';
import type { DocumentActionOutcome } from '../contracts/printExportRequests';

export function useSalesOrderPrintActions() {
  const printService = useDocumentPrintService();

  const toPrintable = useCallback((snapshot: SalesOrderUiSnapshot) => {
    return mapSalesOrderToPrintableDocument(snapshot);
  }, []);

  const print = useCallback(
    async (snapshot: SalesOrderUiSnapshot, showDialog = true): Promise<DocumentActionOutcome> => {
      const doc = toPrintable(snapshot);
      return printService.print('sales_order', doc, { showDialog });
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
