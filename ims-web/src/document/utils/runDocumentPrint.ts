import type { BillFormatKey } from '../contracts/billFormat';
import type { DocumentTypeKey } from '../contracts/documentTypes';
import type { PrintableDocumentV1 } from '../contracts/printableDocument';
import type { DocumentActionOutcome } from '../contracts/printExportRequests';
import type { DocumentPrintService } from '../providers/documentPrintService';
import { openDeferredPrintWindow } from '../../utils/printPreview';

/** Open preview during the user click, then run async print (popup-safe on HTTPS). */
export async function runDocumentPrint(
  printService: DocumentPrintService,
  documentType: DocumentTypeKey,
  document: PrintableDocumentV1,
  options?: { showDialog?: boolean; formatKey?: BillFormatKey },
): Promise<DocumentActionOutcome> {
  const previewWin = openDeferredPrintWindow();
  const outcome = await printService.print(documentType, document, {
    ...options,
    targetWindow: previewWin,
  });
  if (!outcome.ok) previewWin?.close();
  return outcome;
}

export async function runDocumentSavePrintNext(
  printService: DocumentPrintService,
  documentType: DocumentTypeKey,
  document: PrintableDocumentV1,
  onSave: () => Promise<{ ok: boolean; message?: string }>,
): Promise<DocumentActionOutcome> {
  return printService.savePrintNext(documentType, document, onSave);
}

export async function runDocumentPreview(
  printService: DocumentPrintService,
  documentType: DocumentTypeKey,
  document: PrintableDocumentV1,
  formatKey?: BillFormatKey,
): Promise<DocumentActionOutcome> {
  const previewWin = openDeferredPrintWindow();
  const outcome = await printService.preview(documentType, document, formatKey, {
    targetWindow: previewWin,
  });
  if (!outcome.ok) previewWin?.close();
  return outcome;
}
