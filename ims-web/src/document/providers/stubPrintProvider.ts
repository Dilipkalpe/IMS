import type { BillFormatDefinition } from '../contracts/billFormat';
import type { PreviewRequest, PreviewResult, PrintRequest, PrintResult } from '../contracts/printExportRequests';
import type { PrintProvider } from './types';
import { renderPrintableDocumentHtml } from './stubPrintRenderer';

let previewWindow: Window | null = null;

const PRINT_WINDOW_FEATURES = 'noopener,noreferrer,width=900,height=700';

const PRINT_LOADING_HTML =
  '<!DOCTYPE html><html><head><title>Loading…</title></head><body><p style="font-family:Segoe UI,sans-serif;padding:24px;">Loading print preview…</p></body></html>';

/** Open during a user click so async loads can still show print preview (avoids popup blockers). */
export function openDeferredPrintWindow(): Window | null {
  const w = window.open('', '_blank', PRINT_WINDOW_FEATURES);
  if (!w) return null;
  w.document.open();
  w.document.write(PRINT_LOADING_HTML);
  w.document.close();
  return w;
}

export function renderPrintPreviewWindow(win: Window, html: string): void {
  win.document.open();
  win.document.write(html);
  win.document.close();
  win.focus();
}

export const stubPrintProvider: PrintProvider = {
  name: 'stub-print',

  async print(request: PrintRequest, format: BillFormatDefinition): Promise<PrintResult> {
    const html = renderPrintableDocumentHtml(request.document, format);
    const w =
      request.targetWindow && !request.targetWindow.closed
        ? request.targetWindow
        : window.open('', '_blank', PRINT_WINDOW_FEATURES);
    if (!w) {
      return { ok: false, message: 'Popup blocked — allow popups for print preview.' };
    }
    renderPrintPreviewWindow(w, html);
    if (!request.showDialog) {
      w.print();
      return { ok: true, message: `Sent to printer (${format.name}).` };
    }
    return { ok: true, message: `Print preview opened (${format.name}). Use browser Print (Ctrl+P).` };
  },

  async preview(request: PreviewRequest, format: BillFormatDefinition): Promise<PreviewResult> {
    const html = renderPrintableDocumentHtml(request.document, format);
    if (previewWindow && !previewWindow.closed) previewWindow.close();
    const w =
      request.targetWindow && !request.targetWindow.closed
        ? request.targetWindow
        : window.open('', '_blank', PRINT_WINDOW_FEATURES);
    if (!w) {
      return { ok: false, message: 'Popup blocked — allow popups for print preview.' };
    }
    renderPrintPreviewWindow(w, html);
    previewWindow = w;
    return {
      ok: true,
      message: `Preview opened (${format.name}).`,
      previewHtml: html,
    };
  },
};
