import { useCallback } from 'react';
import { handleInvoiceCommunicationAfterSave } from './communication/invoiceCommunicationCoordinator';
import { useInvoiceCommunication } from './context/InvoiceCommunicationContext';
import type { SalesInvoiceHeader } from './types';

export interface SalesInvoiceCommunicationInput {
  header: SalesInvoiceHeader;
  invoiceTotal: number;
  balanceDue: number;
}

function formatDocNo(prefix: string, billNo: string): string {
  const p = (prefix || 'SI').trim().toUpperCase();
  const n = billNo.trim();
  return n ? `${p}-${n}` : p;
}

function buildCompanyContact(sellerGstin?: string): string {
  const parts: string[] = [];
  if (sellerGstin?.trim()) parts.push(`GSTIN: ${sellerGstin.trim()}`);
  return parts.join(' | ');
}

export function useSalesInvoiceAfterSaveCommunication() {
  const communication = useInvoiceCommunication();

  const notifyAfterSave = useCallback(
    async ({ header, invoiceTotal, balanceDue }: SalesInvoiceCommunicationInput) => {
      if (!header.customer?.trim()) return;

      await handleInvoiceCommunicationAfterSave(
        {
          documentKind: 'sales_invoice',
          invoiceNumber: formatDocNo(header.entryDocPrefix, header.billNo),
          invoiceDate: header.invoiceDate,
          partyName: header.customer.trim(),
          amount: invoiceTotal.toFixed(2),
          balanceAmount: balanceDue.toFixed(2),
          companyName: 'IMS Company',
          contactDetails: buildCompanyContact(header.sellerGstin),
        },
        {
          requestChoice: communication.requestChoice,
          showDeliverySummary: communication.showDeliverySummary,
        },
      );
    },
    [communication],
  );

  return { notifyAfterSave };
}
