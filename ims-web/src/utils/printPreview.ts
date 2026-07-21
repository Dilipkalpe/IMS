/** Browser print preview — in-page iframe on HTTP; popup tab on HTTPS with iframe fallback. */

import { authHeaders } from '../api/authToken';

export const PRINT_WINDOW_FEATURES = 'noopener,noreferrer,width=900,height=700';

const OVERLAY_ID = 'ims-print-preview-overlay';
const BODY_LOCK_CLASS = 'ims-print-preview-active';
const HISTORY_STATE_KEY = 'imsPrintPreview';
const MOBILE_PRINT_MQ = '(max-width: 1023px)';

/** Popups are unreliable on plain HTTP — use the in-page iframe overlay instead. */
export function preferInPagePrintPreview(): boolean {
  return typeof window !== 'undefined' && window.location.protocol === 'http:';
}

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

let savedScrollY = 0;
let historyPushed = false;
let keyDownHandler: ((event: KeyboardEvent) => void) | null = null;
let popStateHandler: (() => void) | null = null;
let afterPrintHandler: (() => void) | null = null;

/** Open during a user click so async loads can still show print preview (avoids popup blockers). */
export function openDeferredPrintWindow(): Window | null {
  if (preferInPagePrintPreview()) return null;
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

function isMobilePrintViewport(): boolean {
  return typeof window !== 'undefined' && window.matchMedia(MOBILE_PRINT_MQ).matches;
}

function clearScrollLockStyles(): void {
  const { documentElement: html, body } = document;
  for (const el of [html, body]) {
    el.style.removeProperty('overflow');
    el.style.removeProperty('touch-action');
    el.style.removeProperty('position');
    el.style.removeProperty('top');
    el.style.removeProperty('width');
    el.style.removeProperty('height');
  }
}

function lockBodyScroll(): void {
  // Full-screen overlay already blocks background interaction on mobile; body lock
  // (especially touch-action: none) can stick after iframe.print() on iOS/Android.
  if (isMobilePrintViewport()) return;

  savedScrollY = window.scrollY;
  document.body.classList.add(BODY_LOCK_CLASS);
}

function unlockBodyScroll(): void {
  document.body.classList.remove(BODY_LOCK_CLASS);
  clearScrollLockStyles();
  if (savedScrollY > 0) {
    window.scrollTo(0, savedScrollY);
    savedScrollY = 0;
  }
}

function detachOverlayListeners(): void {
  if (keyDownHandler) {
    document.removeEventListener('keydown', keyDownHandler);
    keyDownHandler = null;
  }
  if (popStateHandler) {
    window.removeEventListener('popstate', popStateHandler);
    popStateHandler = null;
  }
  if (afterPrintHandler) {
    window.removeEventListener('afterprint', afterPrintHandler);
    afterPrintHandler = null;
  }
}

/** Close overlay, restore scroll, and remove all print-preview listeners. */
export function closePrintPreview(fromPopState = false): void {
  document.getElementById(OVERLAY_ID)?.remove();

  const shouldHistoryBack =
    !fromPopState && historyPushed && Boolean(history.state?.[HISTORY_STATE_KEY]);
  historyPushed = false;

  detachOverlayListeners();
  unlockBodyScroll();

  if (shouldHistoryBack) {
    history.back();
  }
}

/** Clear stale body lock when overlay is gone (e.g. navigation, hot reload). */
export function reconcilePrintPreviewBodyLock(): void {
  if (!document.getElementById(OVERLAY_ID)) {
    detachOverlayListeners();
    unlockBodyScroll();
    historyPushed = false;
  }
}

/** Restore natural document scrolling on mobile (clears stale inline locks). */
export function ensureMobileDocumentScroll(): void {
  if (!isMobilePrintViewport()) return;
  document.body.classList.remove(BODY_LOCK_CLASS);
  clearScrollLockStyles();
}

function writeHtmlToIframe(iframe: HTMLIFrameElement, html: string): boolean {
  try {
    iframe.srcdoc = html;
    return true;
  } catch {
    const doc = iframe.contentDocument ?? iframe.contentWindow?.document;
    if (!doc) return false;
    doc.open();
    doc.write(html);
    doc.close();
    return true;
  }
}

function pushPrintPreviewHistory(): void {
  try {
    history.pushState({ [HISTORY_STATE_KEY]: true }, '');
    historyPushed = true;
  } catch {
    historyPushed = false;
  }
}

function attachOverlayCloseHandlers(overlay: HTMLElement): void {
  keyDownHandler = (event: KeyboardEvent) => {
    if (event.key === 'Escape') {
      closePrintPreview();
    }
  };
  document.addEventListener('keydown', keyDownHandler);

  popStateHandler = () => {
    if (document.getElementById(OVERLAY_ID)) {
      closePrintPreview(true);
    }
  };
  window.addEventListener('popstate', popStateHandler);

  overlay.addEventListener('click', (event) => {
    if (event.target === overlay) closePrintPreview();
  });
}

function attachAfterPrintCleanup(iframe: HTMLIFrameElement): void {
  const iframeWindow = iframe.contentWindow;
  if (!iframeWindow) return;

  const onAfterPrint = () => {
    iframeWindow.removeEventListener('afterprint', onAfterPrint);
    if (afterPrintHandler) {
      window.removeEventListener('afterprint', afterPrintHandler);
      afterPrintHandler = null;
    }
    unlockBodyScroll();
    if (isMobilePrintViewport()) {
      closePrintPreview();
    }
  };

  afterPrintHandler = onAfterPrint;
  iframeWindow.addEventListener('afterprint', onAfterPrint);
  window.addEventListener('afterprint', onAfterPrint);
}

function createPrintOverlayFrame(options?: { title?: string }): {
  overlay: HTMLDivElement;
  iframe: HTMLIFrameElement;
  printBtn: HTMLButtonElement;
} {
  const overlay = document.createElement('div');
  overlay.id = OVERLAY_ID;
  overlay.className = 'ims-print-preview-overlay';
  overlay.setAttribute('role', 'dialog');
  overlay.setAttribute('aria-modal', 'true');
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

  closeBtn.addEventListener('click', () => closePrintPreview());

  return { overlay, iframe, printBtn };
}

function openPrintPreviewInOverlay(html: string, options?: OpenPrintPreviewOptions): PrintPreviewOutcome {
  closePrintPreview();
  lockBodyScroll();

  const { overlay, iframe, printBtn } = createPrintOverlayFrame(options);
  document.body.append(overlay);
  pushPrintPreviewHistory();

  if (!writeHtmlToIframe(iframe, html)) {
    closePrintPreview();
    return {
      ok: false,
      message: 'Could not open print preview. Try again or use Export/Download.',
      usedFallback: true,
    };
  }

  attachOverlayCloseHandlers(overlay);

  printBtn.addEventListener('click', () => {
    attachAfterPrintCleanup(iframe);
    try {
      iframe.contentWindow?.focus();
      iframe.contentWindow?.print();
    } catch {
      window.alert('Print failed. Use Ctrl+P while the preview is focused.');
    }
  });

  // Browsers block programmatic print in iframes without a fresh user gesture on HTTP.
  if (options?.autoPrint && !preferInPagePrintPreview()) {
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
    message: options?.autoPrint && preferInPagePrintPreview()
      ? 'Print preview ready — click Print to send to the printer.'
      : 'Print preview opened — click Print or Ctrl+P.',
    usedFallback: true,
  };
}

async function fetchPrintHtml(url: string): Promise<{ ok: true; html: string } | { ok: false; message: string }> {
  try {
    const res = await fetch(url, {
      headers: {
        Accept: 'text/html,application/xhtml+xml',
        ...authHeaders(),
      },
    });
    if (!res.ok) {
      let detail = res.statusText || `HTTP ${res.status}`;
      try {
        const body = await res.text();
        if (body.trim()) detail = body.slice(0, 180);
      } catch {
        /* ignore */
      }
      return { ok: false, message: `Could not load print preview (${detail}).` };
    }
    return { ok: true, html: await res.text() };
  } catch (err) {
    return {
      ok: false,
      message: err instanceof Error ? err.message : 'Could not load print preview.',
    };
  }
}

async function openUrlInOverlay(url: string, options?: { title?: string }): Promise<PrintPreviewOutcome> {
  const loaded = await fetchPrintHtml(url);
  if (!loaded.ok) return loaded;
  return openPrintPreviewInOverlay(loaded.html, { title: options?.title });
}

/** Write HTML to a new tab, or an in-page iframe when popups are blocked. */
export function openHtmlPrintPreview(
  html: string,
  options?: OpenPrintPreviewOptions,
): PrintPreviewOutcome {
  if (preferInPagePrintPreview()) {
    return openPrintPreviewInOverlay(html, options);
  }

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
  if (preferInPagePrintPreview()) {
    return {
      ok: false,
      message: 'URL print preview requires openUrlPrintPreviewAsync on HTTP.',
    };
  }

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

  return {
    ok: false,
    message: 'Popup blocked — allow popups for print preview, or use the in-page preview.',
  };
}

/** Fetch authenticated print HTML, then open preview (required for payslip/API HTML on HTTP). */
export async function openUrlPrintPreviewAsync(
  url: string,
  options?: { targetWindow?: Window | null; title?: string },
): Promise<PrintPreviewOutcome> {
  if (preferInPagePrintPreview()) {
    return openUrlInOverlay(url, { title: options?.title });
  }

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

export function notifyPrintFailure(message: string): void {
  window.alert(message || 'Print failed.');
}
