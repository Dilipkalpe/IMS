import { useCallback, useMemo } from 'react';
import {
  isPaymentModeEnabled,
  normalizePaymentType,
  parseMoney,
} from './invoicePayment';
import {
  collectGstFieldErrors,
  computeTotals,
  formatDisplay,
  isInterStateSupply,
  taxContextFromHeader,
  validateGstTax,
} from './calculations';
import { useSalesCustomerPicker } from '../components/transaction/SalesCustomerPickerContext';
import { getSalesCustomerFieldError } from '../components/transaction/salesCustomerPicker';
import { buildLineDisplayMap } from './lineDisplay';
import type { SalesInvoiceUiSnapshot } from '../document/mappers/salesInvoicePrintMapper';
import type { FieldError, SalesInvoiceHeader, SalesInvoiceLineItem } from './types';
import { useSalesInvoiceAfterSaveCommunication } from './useSalesInvoiceAfterSaveCommunication';
import { useSalesInvoiceWorkspace } from './workspace/SalesInvoiceWorkspaceProvider';

export function useSalesInvoiceDocument(tabId: string) {
  const ws = useSalesInvoiceWorkspace();
  const { notifyAfterSave } = useSalesInvoiceAfterSaveCommunication();
  const { validCustomerNames, customers, loading: customersLoading } = useSalesCustomerPicker();
  const doc = ws.getDocument(tabId);

  const taxContext = useMemo(
    () => taxContextFromHeader(doc.header),
    [doc.header.placeOfSupply, doc.header.sellerGstin, doc.header.customerGstin],
  );

  const lineDisplayMap = useMemo(
    () => buildLineDisplayMap(doc.lines, doc.header),
    [doc.lines, doc.header.placeOfSupply, doc.header.sellerGstin, doc.header.customerGstin],
  );

  const totals = useMemo(
    () =>
      computeTotals(doc.lines, taxContext, {
        paymentType: doc.header.paymentType,
        paidAmount: doc.header.paidAmount,
      }),
    [doc.header.paidAmount, doc.header.paymentType, doc.lines, taxContext],
  );

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
    <K extends keyof SalesInvoiceHeader>(key: K, value: SalesInvoiceHeader[K]) => {
      ws.patchHeader(tabId, key, value);
    },
    [tabId, ws],
  );

  const updatePaymentType = useCallback(
    (paymentType: string) => {
      ws.patchHeader(tabId, 'paymentType', paymentType);
      if (normalizePaymentType(paymentType) === 'credit') {
        ws.patchHeader(tabId, 'paymentMode', 'Cash');
      }
    },
    [tabId, ws],
  );

  const updatePaidAmount = useCallback(
    (raw: string) => {
      ws.patchHeader(tabId, 'paidAmount', parseMoney(raw));
    },
    [tabId, ws],
  );

  const isPartialPayment = normalizePaymentType(doc.header.paymentType) === 'partial';
  const paymentModeEnabled = isPaymentModeEnabled(doc.header.paymentType);

  const canRecordPayment = useMemo(() => {
    const customerError = getSalesCustomerFieldError(doc.header.customer, validCustomerNames);
    return (
      normalizePaymentType(doc.header.paymentType) !== 'cash' &&
      totals.balanceDue > 0.001 &&
      !customerError
    );
  }, [doc.header.customer, doc.header.paymentType, totals.balanceDue, validCustomerNames]);

  const updateLine = useCallback(
    (id: string, patch: Partial<SalesInvoiceLineItem> | SalesInvoiceLineItem) => {
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
    async (products: Parameters<typeof ws.addProductsFromBrowse>[1]) => {
      await ws.addProductsFromBrowse(tabId, products);
    },
    [tabId, ws],
  );

  const validate = useCallback((): boolean => {
    const next: FieldError[] = [];
    const customerError = getSalesCustomerFieldError(doc.header.customer, validCustomerNames);
    if (customerError) next.push(customerError);
    if (!doc.header.billNo?.trim()) next.push({ field: 'billNo', message: 'Invoice number is required.' });
    if (doc.lines.length === 0) next.push({ field: 'lines', message: 'At least one line item is required.' });
    doc.lines.forEach((l, i) => {
      if (l.qty <= 0) next.push({ field: `qty-${l.id}`, message: `Line ${i + 1}: Qty must be greater than zero.` });
    });
    ws.setErrors(tabId, next);
    return next.length === 0;
  }, [doc.header, doc.lines, tabId, validCustomerNames, ws]);

  const getLineDisplay = useCallback(
    (lineId: string) => lineDisplayMap.get(lineId),
    [lineDisplayMap],
  );

  const collectValidationErrors = useCallback((): FieldError[] => {
    const next: FieldError[] = [];
    const customerError = getSalesCustomerFieldError(doc.header.customer, validCustomerNames);
    if (customerError) next.push(customerError);
    if (!doc.header.billNo?.trim()) next.push({ field: 'billNo', message: 'Invoice number is required.' });
    if (doc.lines.length === 0) next.push({ field: 'lines', message: 'At least one line item is required.' });
    doc.lines.forEach((l, i) => {
      if (l.qty <= 0) next.push({ field: `qty-${l.id}`, message: `Line ${i + 1}: Qty must be greater than zero.` });
    });
    next.push(...collectGstFieldErrors(taxContext));
    return next;
  }, [doc.header, doc.lines, taxContext, validCustomerNames]);

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

  const getUiSnapshot = useCallback(
    (): SalesInvoiceUiSnapshot => ({
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
      if (label === 'Cancel' || label === 'Close') {
        return { ok: true };
      }
      if (label === 'New Bill') {
        await ws.prepareNewBill(tabId);
        return { ok: true };
      }
      if (label === 'Save' || label === 'Save, Next (F11)' || label === 'Save, Print, Next (F12)') {
        const result = await ws.saveDocument(tabId);
        if (!result.ok) return { ok: false, firstField: result.firstField };
        await notifyAfterSave({
          header: ws.getDocument(tabId).header,
          invoiceTotal: totals.invoiceTotal,
          balanceDue: totals.balanceDue,
        });
        const remainingTabs = await afterSaveNavigation(label);
        return { ok: true, remainingTabs };
      }
      const v = validateDocument();
      if (!v.ok) return v;
      ws.setStatus(tabId, `${label} (not implemented).`);
      return { ok: true };
    },
    [afterSaveNavigation, notifyAfterSave, tabId, totals.balanceDue, totals.invoiceTotal, validateDocument, ws],
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
    customers,
    customersLoading,
    updateHeader,
    updatePaymentType,
    updatePaidAmount,
    isPartialPayment,
    paymentModeEnabled,
    canRecordPayment,
    paymentLinks: doc.paymentLinks,
    updateLine,
    deleteLine,
    setBarcode,
    addLineFromScan,
    addProductsFromBrowse,
    validate,
    validateDocument,
    getUiSnapshot,
    setStatus,
    save,
    notifyAfterSave,
    tryAction,
    gstWarnings,
    isInterState: isInterStateSupply(taxContext),
    fieldError: (field: string) => doc.errors.find((e) => e.field === field)?.message,
  };
}
