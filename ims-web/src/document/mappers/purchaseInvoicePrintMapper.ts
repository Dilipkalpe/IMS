import {
  computeLine,
  computeTotals,
  resolveLineTaxPercents,
} from '../../sales-invoice/calculations';
import { isInterStateSupply } from '../../sales-invoice/gstTax';
import { purchaseGstContext } from '../../purchase-invoice/taxContext';
import type { PurchaseInvoiceHeader, PurchaseInvoiceLineItem, PurchaseInvoiceTotals } from '../../purchase-invoice/types';
import type { PrintableDocumentV1, PrintableLineV1 } from '../contracts/printableDocument';

export interface PurchaseInvoiceUiSnapshot {
  header: PurchaseInvoiceHeader;
  lines: PurchaseInvoiceLineItem[];
  totals: PurchaseInvoiceTotals;
  documentId?: string;
}

function formatDocNo(prefix: string, billNo: string): string {
  const p = prefix?.trim() || 'PI';
  const n = billNo?.trim();
  return n ? `${p}-${n}` : p;
}

function mapLine(line: PurchaseInvoiceLineItem, header: PurchaseInvoiceHeader): PrintableLineV1 {
  const ctx = purchaseGstContext(header);
  const c = computeLine(line, ctx);
  const percents = resolveLineTaxPercents(line, isInterStateSupply(ctx));
  return {
    lineNo: line.sr,
    productCode: line.productRetailCode,
    description: line.itemDescription,
    qty: line.qty,
    rate: line.rate,
    salesRate: line.salesRate,
    discPercent: line.discPercent,
    taxable: c.taxable,
    cgstPercent: percents.cgstPercent,
    cgstAmount: c.cgstAmount,
    sgstPercent: percents.sgstPercent,
    sgstAmount: c.sgstAmount,
    igstPercent: percents.igstPercent,
    igstAmount: c.igstAmount,
    lineTotal: c.lineTotal,
  };
}

export function mapPurchaseInvoiceToPrintableDocument(snapshot: PurchaseInvoiceUiSnapshot): PrintableDocumentV1 {
  const h = snapshot.header;
  const taxCtx = purchaseGstContext(h);
  return {
    schemaVersion: 1,
    documentType: 'purchase_invoice',
    documentId: snapshot.documentId,
    generatedAt: new Date().toISOString(),
    header: {
      docPrefix: h.entryDocPrefix,
      docNo: h.billNo,
      formattedDocNo: formatDocNo(h.entryDocPrefix, h.billNo),
      documentDate: h.invoiceDate,
      dueDate: h.dueDate,
      reference: h.grnReference,
      paymentType: h.paymentType,
      paymentMode: h.paymentMode,
      narration: h.narration,
      status: 'draft',
    },
    seller: {
      name: h.supplier,
      gstin: h.supplierGstin,
    },
    buyer: {
      name: 'IMS Company',
      gstin: h.companyGstin,
    },
    placeOfSupply: h.placeOfSupply,
    lines: snapshot.lines.map((line) => mapLine(line, h)),
    totals: computeTotals(snapshot.lines, taxCtx),
  };
}
