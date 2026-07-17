import {
  computeLine,
  resolveLineTaxPercents,
  taxContextFromHeader,
} from '../../sales-invoice/calculations';
import { isInterStateSupply } from '../../sales-invoice/gstTax';
import type { SalesInvoiceHeader, SalesInvoiceLineItem, SalesInvoiceTotals } from '../../sales-invoice/types';
import type { PrintableDocumentV1, PrintableLineV1 } from '../contracts/printableDocument';

export interface SalesInvoiceUiSnapshot {
  header: SalesInvoiceHeader;
  lines: SalesInvoiceLineItem[];
  totals: SalesInvoiceTotals;
  documentId?: string;
}

function formatDocNo(prefix: string, billNo: string): string {
  const p = prefix?.trim() || 'SI';
  const n = billNo?.trim();
  return n ? `${p}-${n}` : p;
}

function mapLine(line: SalesInvoiceLineItem, header: SalesInvoiceHeader): PrintableLineV1 {
  const ctx = taxContextFromHeader(header);
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

/** Maps editable UI state → versioned printable document (no React refs). */
export function mapSalesInvoiceToPrintableDocument(snapshot: SalesInvoiceUiSnapshot): PrintableDocumentV1 {
  const h = snapshot.header;
  return {
    schemaVersion: 1,
    documentType: 'sales_invoice',
    documentId: snapshot.documentId,
    generatedAt: new Date().toISOString(),
    header: {
      docPrefix: h.entryDocPrefix,
      docNo: h.billNo,
      formattedDocNo: formatDocNo(h.entryDocPrefix, h.billNo),
      documentDate: h.invoiceDate,
      dueDate: h.dueDate,
      reference: h.dcReference,
      paymentType: h.paymentType,
      paymentMode: h.paymentMode,
      narration: h.narration,
      status: 'draft',
    },
    seller: {
      name: 'IMS Company',
      gstin: h.sellerGstin,
    },
    buyer: {
      name: h.customer,
      gstin: h.customerGstin,
    },
    placeOfSupply: h.placeOfSupply,
    lines: snapshot.lines.map((line) => mapLine(line, h)),
    totals: snapshot.totals,
  };
}
