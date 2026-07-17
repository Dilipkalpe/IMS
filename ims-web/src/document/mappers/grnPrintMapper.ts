import {
  computeLine,
  computeTotals,
  resolveLineTaxPercents,
} from '../../sales-invoice/calculations';
import { isInterStateSupply } from '../../sales-invoice/gstTax';
import type { GrnHeader, GrnLineItem, GrnTotals } from '../../grn/types';
import { grnTaxHeader } from '../../grn/taxContext';
import type { PrintableDocumentV1, PrintableLineV1 } from '../contracts/printableDocument';

export interface GrnUiSnapshot {
  header: GrnHeader;
  lines: GrnLineItem[];
  totals: GrnTotals;
  documentId?: string;
}

function formatDocNo(prefix: string, billNo: string): string {
  const p = prefix?.trim() || 'GRN';
  const n = billNo?.trim();
  return n ? `${p}-${n}` : p;
}

function mapLine(line: GrnLineItem, header: GrnHeader): PrintableLineV1 {
  const ctx = grnTaxHeader(header);
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

export function mapGrnToPrintableDocument(snapshot: GrnUiSnapshot): PrintableDocumentV1 {
  const h = snapshot.header;
  const taxCtx = grnTaxHeader(h);
  return {
    schemaVersion: 1,
    documentType: 'grn',
    documentId: snapshot.documentId,
    generatedAt: new Date().toISOString(),
    header: {
      docPrefix: h.entryDocPrefix,
      docNo: h.billNo,
      formattedDocNo: formatDocNo(h.entryDocPrefix, h.billNo),
      documentDate: h.grnDate,
      reference: h.poReference,
      paymentType: h.warehouse,
      narration: h.narration,
      status: 'open',
    },
    seller: {
      name: h.supplier,
      gstin: h.supplierGstin,
    },
    buyer: {
      name: h.buyer || 'IMS Company',
      gstin: h.companyGstin,
    },
    placeOfSupply: h.placeOfSupply,
    lines: snapshot.lines.map((line) => mapLine(line, h)),
    totals: computeTotals(snapshot.lines, taxCtx),
  };
}
