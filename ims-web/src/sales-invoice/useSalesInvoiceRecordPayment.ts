import { useCallback } from 'react';
import { useAppNavigation } from '../context/AppNavigationContext';
import { useReceiptVoucherNavIntent } from '../receipt-voucher/context/ReceiptVoucherNavIntent';
import { paymentModeToCashBank } from './invoicePayment';
import { useSalesInvoiceDocument } from './useSalesInvoiceDocument';
import { useSalesInvoiceWorkspace } from './workspace/SalesInvoiceWorkspaceProvider';

function formatSiDocNo(prefix: string, billNo: string): string {
  const p = (prefix || 'SI').trim().toUpperCase();
  const n = billNo.trim();
  return n ? `${p}-${n}` : p;
}

export function useSalesInvoiceRecordPayment(tabId: string) {
  const navigate = useAppNavigation();
  const ws = useSalesInvoiceWorkspace();
  const doc = useSalesInvoiceDocument(tabId);
  const { publishOpenIntent } = useReceiptVoucherNavIntent();

  const startRecordPayment = useCallback(async (): Promise<{
    ok: boolean;
    firstField?: string;
    message?: string;
  }> => {
    if (!doc.canRecordPayment) {
      return { ok: false, message: 'This invoice cannot accept a payment.' };
    }

    const validation = doc.validateDocument();
    if (!validation.ok) {
      return validation;
    }

    if (doc.isDirty || !doc.documentId) {
      const saved = await doc.save();
      if (!saved.ok) {
        return { ok: false, firstField: saved.firstField, message: saved.message };
      }
      await doc.notifyAfterSave({
        header: ws.getDocument(tabId).header,
        invoiceTotal: doc.totals.invoiceTotal,
        balanceDue: doc.totals.balanceDue,
      });
    }

    const documentId = ws.getDocument(tabId).documentId;
    if (!documentId) {
      return { ok: false, message: 'Save the invoice before recording payment.' };
    }

    let balanceDue = doc.totals.balanceDue;
    if (balanceDue <= 0.001) {
      const reloaded = await ws.reloadDocumentPayment(tabId);
      balanceDue = reloaded.balanceDue;
    }

    if (balanceDue <= 0.001) {
      return { ok: false, message: 'This invoice has no balance due.' };
    }

    const h = ws.getDocument(tabId).header;
    const formattedDocNo = formatSiDocNo(h.entryDocPrefix, h.billNo);

    publishOpenIntent({
      type: 'invoicePayment',
      seed: {
        sourceDocType: 'sales_invoice',
        sourceDocId: documentId,
        formattedDocNo,
        partyName: h.customer.trim(),
        amountDue: balanceDue,
        cashBank: paymentModeToCashBank(h.paymentMode),
        voucherKind: 'receipt',
      },
      returnNavKey: 'sales-invoice-entry',
      onPaymentRecorded: () => {
        void ws.reloadDocumentPayment(tabId);
      },
    });

    navigate('receipt-voucher-entry');
    return { ok: true };
  }, [doc, navigate, publishOpenIntent, tabId, ws]);

  return { startRecordPayment };
}
