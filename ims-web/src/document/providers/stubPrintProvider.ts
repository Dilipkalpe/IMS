import type { BillFormatDefinition } from '../contracts/billFormat';
import type { PreviewRequest, PreviewResult, PrintRequest, PrintResult } from '../contracts/printExportRequests';
import type { PrintProvider } from './types';
import { renderPrintableDocumentHtml } from './stubPrintRenderer';
import {
  openDeferredPrintWindow,
  openHtmlPrintPreview,
  renderPrintPreviewWindow,
} from '../../utils/printPreview';

export { openDeferredPrintWindow, renderPrintPreviewWindow } from '../../utils/printPreview';

let previewWindow: Window | null = null;

export const stubPrintProvider: PrintProvider = {
  name: 'stub-print',

  async print(request: PrintRequest, format: BillFormatDefinition): Promise<PrintResult> {
    const html = renderPrintableDocumentHtml(request.document, format);
    const outcome = openHtmlPrintPreview(html, {
      autoPrint: request.showDialog === false,
      title: request.document.header.formattedDocNo || format.name,
      targetWindow: request.targetWindow,
    });
    if (!outcome.ok) {
      return { ok: false, message: outcome.message };
    }
    if (outcome.usedFallback) {
      return { ok: true, message: outcome.message };
    }
    if (!request.showDialog) {
      return { ok: true, message: `Sent to printer (${format.name}).` };
    }
    return { ok: true, message: `Print preview opened (${format.name}). Use browser Print (Ctrl+P).` };
  },

  async preview(request: PreviewRequest, format: BillFormatDefinition): Promise<PreviewResult> {
    const html = renderPrintableDocumentHtml(request.document, format);
    if (previewWindow && !previewWindow.closed) previewWindow.close();
    const outcome = openHtmlPrintPreview(html, {
      title: request.document.header.formattedDocNo || format.name,
      targetWindow: request.targetWindow,
    });
    if (!outcome.ok) {
      return { ok: false, message: outcome.message };
    }
    previewWindow = outcome.window ?? null;
    return {
      ok: true,
      message: `Preview opened (${format.name}).`,
      previewHtml: html,
    };
  },
};
