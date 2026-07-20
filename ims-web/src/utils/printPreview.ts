/** Browser print preview — opens during user gesture; iframe fallback when popups are blocked. */

export const PRINT_WINDOW_FEATURES = 'noopener,noreferrer,width=900,height=700';

const OVERLAY_ID = 'ims-print-preview-overlay';

export const PRINT_LOADING_HTML =
  '<!DOCTYPE html><html><head><title>Loading…</title></head><body><p style="font-family:Segoe UI,sans-serif;padding:24px;">Loading print preview…</p></body></html>';

export interface OpenPrintPreviewOptions {
  autoPrint?: boolean;
  title?: string;
  /** Reuse a window opened synchronously on user click (before async work). */
  targetWindow?: Window | null;
}

export interface PrintPreviewOutcome {
  ok: boolean;
  message: string;
  window?: Window | null;
  usedFallback?: boolean;
}

/** Open during a user click so async loads can still show print preview (avoids popup blockers). */
export function openDeferredPrintWindow(): Window | null {
  const w = window.open('', '_blank', PRINT_WINDOW_FEATURES);
  if (!w) return null;
  renderPrintPreviewWindow(w, PRINT_LOADING_HTML);
  return w;
}

export function renderPrintPreviewWindow(win: Window, html: string, options?: { title?: string }): void {
  win.document.open();
  win.document.write(html);
  win.document.close();
  if (options?.title) {
    try {
      win.document.title = options.title;
    } catch {
      /* cross-origin */
    }
  }
  win.focus();
}

function triggerWindowPrint(win: Window): void {
  // document.write content may not be ready synchronously.
  setTimeout(() => {
    try {
      win.print();
    } catch {
      /* ignore */
    }
  }, 250);
}

function removePrintOverlay(): void {
  document.getElementById(OVERLAY_ID)?.remove();
}

function openPrintPreviewInOverlay(html: string, options?: OpenPrintPreviewOptions): PrintPreviewOutcome {
  removePrintOverlay();

  const overlay = document.createElement('div');
  overlay.id = OVERLAY_ID;
  overlay.className = 'ims-print-preview-overlay';
  overlay.setAttribute('role', 'dialog');
  overlay.setAttribute('aria-label', 'Print preview');

  const panel = document.createElement('div');
  panel.className = 'ims-print-preview-panel';

  const toolbar = document.createElement('div');
  toolbar.className = 'ims-print-preview-toolbar';

  const titleEl = document.createElement('span');
  titleEl.className = 'ims-print-preview-title';
  titleEl.textContent = options?.title?.trim() || 'Print preview';

  const printBtn = document.createElement('button');
  printBtn.type = 'button';
  printBtn.className = 'ims-print-preview-btn ims-print-preview-btn--primary';
  printBtn.textContent = 'Print';

  const closeBtn = document.createElement('button');
  closeBtn.type = 'button';
  closeBtn.className = 'ims-print-preview-btn';
  closeBtn.textContent = 'Close';

  toolbar.append(titleEl, printBtn, closeBtn);

  const iframe = document.createElement('iframe');
  iframe.className = 'ims-print-preview-frame';
  iframe.title = options?.title?.trim() || 'Print preview';

  panel.append(toolbar, iframe);
  overlay.append(panel);
  document.body.append(overlay);

  const close = () => removePrintOverlay();
  closeBtn.addEventListener('click', close);
  overlay.addEventListener('click', (event) => {
    if (event.target === overlay) close();
  });

  const doc = iframe.contentDocument ?? iframe.contentWindow?.document;
  if (doc) {
    doc.open();
    doc.write(html);
    doc.close();
  }

  printBtn.addEventListener('click', () => {
    try {
      iframe.contentWindow?.focus();
      iframe.contentWindow?.print();
    } catch {
      /* ignore */
    }
  });

  if (options?.autoPrint) {
    setTimeout(() => {
      try {
        iframe.contentWindow?.print();
      } catch {
        /* ignore */
      }
    }, 300);
  }

  return {
    ok: true,
    message: 'Print preview opened in page (popup was blocked). Use Print or Ctrl+P.',
    usedFallback: true,
  };
}

function openUrlInOverlay(url: string, options?: { title?: string }): PrintPreviewOutcome {
  removePrintOverlay();

  const overlay = document.createElement('div');
  overlay.id = OVERLAY_ID;
  overlay.className = 'ims-print-preview-overlay';
  overlay.setAttribute('role', 'dialog');
  overlay.setAttribute('aria-label', 'Print preview');

  const panel = document.createElement('div');
  panel.className = 'ims-print-preview-panel';

  const toolbar = document.createElement('div');
  toolbar.className = 'ims-print-preview-toolbar';

  const titleEl = document.createElement('span');
  titleEl.className = 'ims-print-preview-title';
  titleEl.textContent = options?.title?.trim() || 'Print preview';

  const printBtn = document.createElement('button');
  printBtn.type = 'button';
  printBtn.className = 'ims-print-preview-btn ims-print-preview-btn--primary';
  printBtn.textContent = 'Print';

  const closeBtn = document.createElement('button');
  closeBtn.type = 'button';
  closeBtn.className = 'ims-print-preview-btn';
  closeBtn.textContent = 'Close';

  toolbar.append(titleEl, printBtn, closeBtn);

  const iframe = document.createElement('iframe');
  iframe.className = 'ims-print-preview-frame';
  iframe.title = options?.title?.trim() || 'Print preview';
  iframe.src = url;

  panel.append(toolbar, iframe);
  overlay.append(panel);
  document.body.append(overlay);

  const close = () => removePrintOverlay();
  closeBtn.addEventListener('click', close);
  overlay.addEventListener('click', (event) => {
    if (event.target === overlay) close();
  });

  printBtn.addEventListener('click', () => {
    try {
      iframe.contentWindow?.focus();
      iframe.contentWindow?.print();
    } catch {
      /* ignore */
    }
  });

  return {
    ok: true,
    message: 'Print preview opened in page (popup was blocked). Use Print or Ctrl+P.',
    usedFallback: true,
  };
}

/** Write HTML to a new tab, or an in-page iframe when popups are blocked. */
export function openHtmlPrintPreview(
  html: string,
  options?: OpenPrintPreviewOptions,
): PrintPreviewOutcome {
  const reuse =
    options?.targetWindow && !options.targetWindow.closed ? options.targetWindow : null;
  const w = reuse ?? window.open('', '_blank', PRINT_WINDOW_FEATURES);

  if (w) {
    renderPrintPreviewWindow(w, html, { title: options?.title });
    if (options?.autoPrint) {
      triggerWindowPrint(w);
      return {
        ok: true,
        message: 'Sent to printer.',
        window: w,
      };
    }
    return {
      ok: true,
      message: 'Print preview opened — use Ctrl+P to print.',
      window: w,
    };
  }

  return openPrintPreviewInOverlay(html, options);
}

/** Navigate an existing preview window (or open a new one) to a print URL. */
export function openUrlPrintPreview(
  url: string,
  options?: { targetWindow?: Window | null; title?: string },
): PrintPreviewOutcome {
  const reuse =
    options?.targetWindow && !options.targetWindow.closed ? options.targetWindow : null;

  if (reuse) {
    reuse.location.href = url;
    reuse.focus();
    return { ok: true, message: 'Print preview opened.', window: reuse };
  }

  const w = window.open(url, '_blank', PRINT_WINDOW_FEATURES);
  if (w) {
    w.focus();
    return { ok: true, message: 'Print preview opened.', window: w };
  }

  return openUrlInOverlay(url, { title: options?.title });
}
