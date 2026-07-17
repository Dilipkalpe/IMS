import { useCallback } from 'react';
import { findAccountByName } from '../api/accounts';
import { useAppNavigation } from '../context/AppNavigationContext';
import { usePaymentVoucherNavIntent } from '../payment-voucher/context/PaymentVoucherNavIntent';
import { paymentModeToCashBank } from '../sales-invoice/invoicePayment';
import { usePurchaseInvoiceDocument } from './usePurchaseInvoiceDocument';
import { usePurchaseInvoiceWorkspace } from './workspace/PurchaseInvoiceWorkspaceProvider';

function formatPiDocNo(prefix: string, billNo: string): string {
  const p = (prefix || 'PI').trim().toUpperCase();
  const n = billNo.trim();
  return n ? `${p}-${n}` : p;
}

export function usePurchaseInvoiceRecordPayment(tabId: string) {
  const navigate = useAppNavigation();
  const ws = usePurchaseInvoiceWorkspace();
  const doc = usePurchaseInvoiceDocument(tabId);
  const { publishOpenIntent } = usePaymentVoucherNavIntent();

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
    const formattedDocNo = formatPiDocNo(h.entryDocPrefix, h.billNo);
    const supplierAccount = await findAccountByName(h.supplier.trim(), 'supplier');

    publishOpenIntent({
      type: 'invoicePayment',
      seed: {
        sourceDocType: 'purchase_invoice',
        sourceDocId: documentId,
        formattedDocNo,
        partyName: h.supplier.trim(),
        partyAccountCode: supplierAccount?.code,
        amountDue: balanceDue,
        cashBank: paymentModeToCashBank(h.paymentMode),
        voucherKind: 'payment',
      },
      returnNavKey: 'purchase-invoice-entry',
      onPaymentRecorded: () => {
        void ws.reloadDocumentPayment(tabId);
      },
    });

    navigate('payment-voucher-entry');
    return { ok: true };
  }, [doc, navigate, publishOpenIntent, tabId, ws]);

  return { startRecordPayment };
}
