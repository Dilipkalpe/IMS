import { useCallback, useMemo } from 'react';
import {
  collectGstFieldErrors,
  computeTotals,
  formatDisplay,
  isInterStateSupply,
  validateGstTax,
} from '../sales-invoice/calculations';
import type { PurchaseOrderUiSnapshot } from '../document/mappers/purchaseOrderPrintMapper';
import { buildLineDisplayMap } from './lineDisplay';
import { purchaseOrderTaxHeader } from './taxContext';
import type { FieldError, PurchaseOrderHeader, PurchaseOrderLineItem } from './types';
import { usePurchaseOrderWorkspace } from './workspace/PurchaseOrderWorkspaceProvider';

export function usePurchaseOrderDocument(tabId: string) {
  const ws = usePurchaseOrderWorkspace();
  const doc = ws.getDocument(tabId);

  const taxContext = useMemo(() => purchaseOrderTaxHeader(doc.header), [doc.header]);

  const lineDisplayMap = useMemo(
    () => buildLineDisplayMap(doc.lines, doc.header),
    [doc.lines, doc.header],
  );

  const totals = useMemo(() => computeTotals(doc.lines, taxContext), [doc.lines, taxContext]);

  const displayTotals = useMemo(
    () => ({
      totalTaxableDisplay: formatDisplay(totals.totalTaxable),
      totalCgstDisplay: formatDisplay(totals.totalCgst),
      totalSgstDisplay: formatDisplay(totals.totalSgst),
      totalIgstDisplay: formatDisplay(totals.totalIgst),
      totalDiscountDisplay: formatDisplay(totals.totalDiscount),
      invoiceTotalDisplay: formatDisplay(totals.invoiceTotal),
      paidAmountDisplay: formatDisplay(totals.paidAmount),
      balanceDueDisplay: formatDisplay(totals.balanceDue),
      roundOffDisplay: formatDisplay(totals.roundOff),
    }),
    [totals],
  );

  const updateHeader = useCallback(
    <K extends keyof PurchaseOrderHeader>(key: K, value: PurchaseOrderHeader[K]) => {
      ws.patchHeader(tabId, key, value);
    },
    [tabId, ws],
  );

  const updateLine = useCallback(
    (id: string, patch: Partial<PurchaseOrderLineItem> | PurchaseOrderLineItem) => {
      ws.patchLine(tabId, id, patch);
    },
    [tabId, ws],
  );

  const deleteLine = useCallback(
    (id: string) => {
      ws.deleteLine(tabId, id);
    },
    [tabId, ws],
  );

  const setBarcode = useCallback(
    (value: string) => {
      ws.setBarcode(tabId, value);
    },
    [tabId, ws],
  );

  const addLineFromScan = useCallback(async () => {
    await ws.addLineFromScan(tabId);
  }, [tabId, ws]);

  const addProductsFromBrowse = useCallback(
    (products: Parameters<typeof ws.addProductsFromBrowse>[1]) => {
      ws.addProductsFromBrowse(tabId, products);
    },
    [tabId, ws],
  );

  const collectValidationErrors = useCallback((): FieldError[] => {
    const next: FieldError[] = [];
    if (!doc.header.supplier?.trim()) next.push({ field: 'supplier', message: 'Supplier is required.' });
    if (!doc.header.billNo?.trim()) next.push({ field: 'billNo', message: 'Order number is required.' });
    if (doc.lines.length === 0) next.push({ field: 'lines', message: 'At least one line item is required.' });
    doc.lines.forEach((l, i) => {
      if (l.qty <= 0) next.push({ field: `qty-${l.id}`, message: `Line ${i + 1}: Qty must be greater than zero.` });
    });
    next.push(...collectGstFieldErrors(taxContext));
    return next;
  }, [doc.header, doc.lines, taxContext]);

  const gstWarnings = useMemo(() => validateGstTax(taxContext).filter((m) => m.severity === 'warning'), [taxContext]);

  const validateDocument = useCallback((): { ok: boolean; firstField?: string } => {
    const next = collectValidationErrors();
    if (next.length > 0) {
      ws.setErrors(tabId, next);
      ws.setStatus(tabId, 'Fix validation errors before continuing.');
      return { ok: false, firstField: next[0].field };
    }
    ws.setErrors(tabId, []);
    return { ok: true };
  }, [collectValidationErrors, tabId, ws]);

  const getLineDisplay = useCallback(
    (lineId: string) => lineDisplayMap.get(lineId),
    [lineDisplayMap],
  );

  const getUiSnapshot = useCallback(
    (): PurchaseOrderUiSnapshot => ({
      documentId: doc.documentId ?? doc.clientDocumentId,
      header: doc.header,
      lines: doc.lines,
      totals,
    }),
    [doc.clientDocumentId, doc.documentId, doc.header, doc.lines, totals],
  );

  const setStatus = useCallback(
    (message: string | null) => {
      ws.setStatus(tabId, message);
    },
    [tabId, ws],
  );

  const save = useCallback(async () => ws.saveDocument(tabId), [tabId, ws]);

  const afterSaveNavigation = useCallback(
    async (label: string) => {
      const isEdit = doc.documentId != null;
      if (label === 'Save, Next (F11)' || label === 'Save, Print, Next (F12)') {
        if (isEdit) {
          await ws.continueWithNextBill(tabId);
          return 1;
        }
        await ws.prepareNewBill(tabId);
        return 1;
      }
      return 1;
    },
    [doc.documentId, tabId, ws],
  );

  const tryAction = useCallback(
    async (label: string): Promise<{ ok: boolean; firstField?: string; remainingTabs?: number }> => {
      if (label === 'Cancel' || label === 'Close') return { ok: true };
      if (label === 'New Bill') {
        await ws.prepareNewBill(tabId);
        return { ok: true };
      }
      if (label === 'Save' || label === 'Save, Next (F11)' || label === 'Save, Print, Next (F12)') {
        const result = await ws.saveDocument(tabId);
        if (!result.ok) return { ok: false, firstField: result.firstField };
        const remainingTabs = await afterSaveNavigation(label);
        return { ok: true, remainingTabs };
      }
      const v = validateDocument();
      if (!v.ok) return v;
      ws.setStatus(tabId, `${label} (not implemented).`);
      return { ok: true };
    },
    [afterSaveNavigation, tabId, validateDocument, ws],
  );

  return {
    isEdit: doc.documentId != null,
    documentId: doc.documentId,
    clientDocumentId: doc.clientDocumentId,
    isDirty: doc.isDirty,
    isLoading: doc.isLoading,
    isSaving: doc.isSaving,
    loadError: doc.loadError,
    header: doc.header,
    lines: doc.lines,
    lineCount: doc.lines.length,
    barcode: doc.barcode,
    errors: doc.errors,
    statusMessage: doc.statusMessage,
    totals,
    displayTotals,
    lineDisplayMap,
    getLineDisplay,
    updateHeader,
    updateLine,
    deleteLine,
    setBarcode,
    addLineFromScan,
    addProductsFromBrowse,
    validateDocument,
    getUiSnapshot,
    setStatus,
    save,
    tryAction,
    gstWarnings,
    isInterState: isInterStateSupply(taxContext),
    fieldError: (field: string) => doc.errors.find((e) => e.field === field)?.message,
  };
}
