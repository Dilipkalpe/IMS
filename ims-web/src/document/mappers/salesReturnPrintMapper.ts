import {
  computeLine,
  computeTotals,
  resolveLineTaxPercents,
  taxContextFromHeader,
} from '../../sales-invoice/calculations';
import { isInterStateSupply } from '../../sales-invoice/gstTax';
import type { SalesReturnHeader, SalesReturnLineItem, SalesReturnTotals } from '../../sales-return/types';
import type { PrintableDocumentV1, PrintableLineV1 } from '../contracts/printableDocument';

export interface SalesReturnUiSnapshot {
  header: SalesReturnHeader;
  lines: SalesReturnLineItem[];
  totals: SalesReturnTotals;
  documentId?: string;
}

function formatDocNo(prefix: string, billNo: string): string {
  const p = prefix?.trim() || 'SR';
  const n = billNo?.trim();
  return n ? `${p}-${n}` : p;
}

function mapLine(line: SalesReturnLineItem, header: SalesReturnHeader): PrintableLineV1 {
  const ctx = taxContextFromHeader({
    placeOfSupply: header.placeOfSupply,
    sellerGstin: header.sellerGstin,
    customerGstin: header.customerGstin,
  });
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

export function mapSalesReturnToPrintableDocument(snapshot: SalesReturnUiSnapshot): PrintableDocumentV1 {
  const h = snapshot.header;
  const taxCtx = taxContextFromHeader({
    placeOfSupply: h.placeOfSupply,
    sellerGstin: h.sellerGstin,
    customerGstin: h.customerGstin,
  });
  return {
    schemaVersion: 1,
    documentType: 'sales_return',
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
      gstin: h.sellerGstin,
    },
    buyer: {
      name: h.customer,
      gstin: h.customerGstin,
    },
    placeOfSupply: h.placeOfSupply,
    lines: snapshot.lines.map((line) => mapLine(line, h)),
    totals: computeTotals(snapshot.lines, taxCtx),
  };
}
