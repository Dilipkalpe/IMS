import { useCallback } from 'react';
import { mapSalesInvoiceToPrintableDocument } from '../mappers/salesInvoicePrintMapper';
import { useDocumentPrintService } from '../context/DocumentPrintContext';
import type { DocumentActionOutcome } from '../contracts/printExportRequests';
import type { SalesInvoiceUiSnapshot } from '../mappers/salesInvoicePrintMapper';

export function useSalesInvoicePrintActions() {
  const printService = useDocumentPrintService();

  const toPrintable = useCallback((snapshot: SalesInvoiceUiSnapshot) => {
    return mapSalesInvoiceToPrintableDocument(snapshot);
  }, []);

  const print = useCallback(
    async (snapshot: SalesInvoiceUiSnapshot, showDialog = true): Promise<DocumentActionOutcome> => {
      const doc = toPrintable(snapshot);
      return printService.print('sales_invoice', doc, { showDialog });
    },
    [printService, toPrintable],
  );

  const preview = useCallback(
    async (snapshot: SalesInvoiceUiSnapshot): Promise<DocumentActionOutcome> => {
      const doc = toPrintable(snapshot);
      return printService.preview('sales_invoice', doc);
    },
    [printService, toPrintable],
  );

  const exportPdf = useCallback(
    async (snapshot: SalesInvoiceUiSnapshot): Promise<DocumentActionOutcome> => {
      const doc = toPrintable(snapshot);
      return printService.export('sales_invoice', doc, 'pdf');
    },
    [printService, toPrintable],
  );

  const savePrintNext = useCallback(
    async (
      snapshot: SalesInvoiceUiSnapshot,
      onSave: () => Promise<{ ok: boolean; message?: string }>,
    ): Promise<DocumentActionOutcome> => {
      const doc = toPrintable(snapshot);
      return printService.savePrintNext('sales_invoice', doc, onSave);
    },
    [printService, toPrintable],
  );

  return { toPrintable, print, preview, exportPdf, savePrintNext };
}
