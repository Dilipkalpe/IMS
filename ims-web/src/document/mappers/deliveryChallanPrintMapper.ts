import {
  computeLine,
  computeTotals,
  resolveLineTaxPercents,
} from '../../sales-invoice/calculations';
import { isInterStateSupply } from '../../sales-invoice/gstTax';
import type { DeliveryChallanHeader, DeliveryChallanLineItem, DeliveryChallanTotals } from '../../delivery-challan/types';
import { dcTaxHeader } from '../../delivery-challan/taxContext';
import type { PrintableDocumentV1, PrintableLineV1 } from '../contracts/printableDocument';

export interface DeliveryChallanUiSnapshot {
  header: DeliveryChallanHeader;
  lines: DeliveryChallanLineItem[];
  totals: DeliveryChallanTotals;
  documentId?: string;
}

function formatDocNo(prefix: string, billNo: string): string {
  const p = prefix?.trim() || 'DC';
  const n = billNo?.trim();
  return n ? `${p}-${n}` : p;
}

function mapLine(line: DeliveryChallanLineItem, header: DeliveryChallanHeader): PrintableLineV1 {
  const ctx = dcTaxHeader(header);
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

export function mapDeliveryChallanToPrintableDocument(snapshot: DeliveryChallanUiSnapshot): PrintableDocumentV1 {
  const h = snapshot.header;
  const taxCtx = dcTaxHeader(h);
  return {
    schemaVersion: 1,
    documentType: 'delivery_challan',
    documentId: snapshot.documentId,
    generatedAt: new Date().toISOString(),
    header: {
      docPrefix: h.entryDocPrefix,
      docNo: h.billNo,
      formattedDocNo: formatDocNo(h.entryDocPrefix, h.billNo),
      documentDate: h.dcDate,
      reference: h.soReference,
      paymentType: h.warehouse,
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
