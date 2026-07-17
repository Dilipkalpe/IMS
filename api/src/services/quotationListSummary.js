function parseNum(value) {
  if (value === null || value === undefined) return 0;
  const n = Number(value);
  if (Number.isFinite(n)) return n;
  const s = String(value).replace(/,/g, '').trim();
  const p = parseFloat(s);
  return Number.isFinite(p) ? p : 0;
}

function roundMoney(n) {
  return Math.round((Number(n) + Number.EPSILON) * 100) / 100;
}

/**
 * Summarize line-level GST and amounts for list views (no line payload returned).
 * @param {Array<{ qty?: string, rate?: string, discPercent?: string, discValue?: string, taxType?: string, taxPercent?: string, amount?: string }>} lines
 * @param {Record<string, string>|undefined} totals
 */
export function summarizeQuotationLines(lines, totals) {
  let totalTaxable = 0;
  let totalCgst = 0;
  let totalSgst = 0;
  let totalIgst = 0;
  let totalDiscount = 0;

  for (const line of lines || []) {
    const qty = parseNum(line.qty);
    const rate = parseNum(line.rate);
    let gross = qty * rate;
    if (gross <= 0) {
      const lineAmount = parseNum(line.amount);
      if (lineAmount > 0) gross = lineAmount;
    }
    let disc = parseNum(line.discValue);
    const discPct = parseNum(line.discPercent);
    if (disc <= 0 && discPct > 0) disc = (gross * discPct) / 100;
    totalDiscount += disc;

    const taxable = Math.max(0, gross - disc);
    totalTaxable += taxable;

    const taxPct = parseNum(line.taxPercent);
    const taxAmt = (taxable * taxPct) / 100;
    const taxType = String(line.taxType || 'GST').toUpperCase();
    if (taxType.includes('IGST')) {
      totalIgst += taxAmt;
    } else {
      totalCgst += taxAmt / 2;
      totalSgst += taxAmt / 2;
    }
  }

  const saleAmount = roundMoney(
    parseNum(totals?.saleAmount) ||
      parseNum(totals?.orderAmount) ||
      parseNum(totals?.net) ||
      parseNum(totals?.gross) ||
      totalTaxable + totalCgst + totalSgst + totalIgst
  );

  const receivable = parseNum(totals?.receivableToCustomer);
  const paidAmount = receivable > 0 ? roundMoney(Math.max(0, saleAmount - receivable)) : saleAmount;
  const balance = roundMoney(Math.max(0, saleAmount - paidAmount));

  return {
    totalTaxable: roundMoney(totalTaxable),
    totalCgst: roundMoney(totalCgst),
    totalSgst: roundMoney(totalSgst),
    totalIgst: roundMoney(totalIgst),
    totalDiscount: roundMoney(totalDiscount),
    salesAmount: saleAmount,
    paidAmount,
    balance
  };
}

/**
 * @param {import('mongoose').LeanDocument} doc
 */
export function toQuotationListItem(doc) {
  const summary = summarizeQuotationLines(doc.lines, doc.totals);
  return {
    id: String(doc._id),
    qtPrefix: doc.qtPrefix,
    docNo: doc.docNo,
    formattedDocNo: doc.formattedDocNo,
    quoteDate: doc.quoteDate,
    billDate: doc.billDate,
    customer: doc.customer,
    status: doc.status,
    ...summary
  };
}

export { resolveQuotationSort, fetchQuotationListPage, fetchQuotationListResponse } from './quotationListQuery.js';
