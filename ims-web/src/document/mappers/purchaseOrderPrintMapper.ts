import {
  computeLine,
  computeTotals,
  resolveLineTaxPercents,
} from '../../sales-invoice/calculations';
import { isInterStateSupply } from '../../sales-invoice/gstTax';
import type { PurchaseOrderHeader, PurchaseOrderLineItem, PurchaseOrderTotals } from '../../purchase-order/types';
import { purchaseOrderTaxHeader } from '../../purchase-order/taxContext';
import type { PrintableDocumentV1, PrintableLineV1 } from '../contracts/printableDocument';

export interface PurchaseOrderUiSnapshot {
  header: PurchaseOrderHeader;
  lines: PurchaseOrderLineItem[];
  totals: PurchaseOrderTotals;
  documentId?: string;
}

function formatDocNo(prefix: string, billNo: string): string {
  const p = prefix?.trim() || 'PO';
  const n = billNo?.trim();
  return n ? `${p}-${n}` : p;
}

function mapLine(line: PurchaseOrderLineItem, header: PurchaseOrderHeader): PrintableLineV1 {
  const ctx = purchaseOrderTaxHeader(header);
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

export function mapPurchaseOrderToPrintableDocument(snapshot: PurchaseOrderUiSnapshot): PrintableDocumentV1 {
  const h = snapshot.header;
  const taxCtx = purchaseOrderTaxHeader(h);
  return {
    schemaVersion: 1,
    documentType: 'purchase_order',
    documentId: snapshot.documentId,
    generatedAt: new Date().toISOString(),
    header: {
      docPrefix: h.entryDocPrefix,
      docNo: h.billNo,
      formattedDocNo: formatDocNo(h.entryDocPrefix, h.billNo),
      documentDate: h.orderDate,
      dueDate: h.dueDate,
      reference: h.paymentTerms,
      paymentType: h.deliveryPriority,
      narration: h.narration,
      status: 'open',
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
