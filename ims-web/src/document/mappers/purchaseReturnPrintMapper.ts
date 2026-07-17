import {
  computeLine,
  computeTotals,
  resolveLineTaxPercents,
  taxContextFromHeader,
} from '../../sales-invoice/calculations';
import { isInterStateSupply } from '../../sales-invoice/gstTax';
import type { PurchaseReturnHeader, PurchaseReturnLineItem, PurchaseReturnTotals } from '../../purchase-return/types';
import type { PrintableDocumentV1, PrintableLineV1 } from '../contracts/printableDocument';

export interface PurchaseReturnUiSnapshot {
  header: PurchaseReturnHeader;
  lines: PurchaseReturnLineItem[];
  totals: PurchaseReturnTotals;
  documentId?: string;
}

function formatDocNo(prefix: string, billNo: string): string {
  const p = prefix?.trim() || 'PR';
  const n = billNo?.trim();
  return n ? `${p}-${n}` : p;
}

function taxHeader(header: PurchaseReturnHeader) {
  return taxContextFromHeader({
    placeOfSupply: header.placeOfSupply,
    sellerGstin: header.companyGstin,
    customerGstin: header.supplierGstin,
  });
}

function mapLine(line: PurchaseReturnLineItem, header: PurchaseReturnHeader): PrintableLineV1 {
  const ctx = taxHeader(header);
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

export function mapPurchaseReturnToPrintableDocument(snapshot: PurchaseReturnUiSnapshot): PrintableDocumentV1 {
  const h = snapshot.header;
  const taxCtx = taxHeader(h);
  return {
    schemaVersion: 1,
    documentType: 'purchase_return',
    documentId: snapshot.documentId,
    generatedAt: new Date().toISOString(),
    header: {
      docPrefix: h.entryDocPrefix,
      docNo: h.billNo,
      formattedDocNo: formatDocNo(h.entryDocPrefix, h.billNo),
      documentDate: h.returnDate,
      reference: h.invoiceReference,
      paymentType: h.returnWarehouse,
      narration: h.narration,
      status: 'open',
    },
    seller: {
      name: 'IMS Company',
      gstin: h.companyGstin,
    },
    buyer: {
      name: h.supplier,
      gstin: h.supplierGstin,
    },
    placeOfSupply: h.placeOfSupply,
    lines: snapshot.lines.map((line) => mapLine(line, h)),
    totals: computeTotals(snapshot.lines, taxCtx),
  };
}
