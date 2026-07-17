import { PurchaseInvoice } from '../models/PurchaseInvoice.js';

function parseRate(value) {
  const n = Number(String(value ?? '0').replace(/,/g, ''));
  return Number.isFinite(n) && n > 0 ? n : 0;
}

function parseBillDate(value) {
  if (!value) return null;
  const text = String(value).trim();
  const match = text.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (match) {
    const day = Number(match[1]);
    const month = Number(match[2]) - 1;
    const year = Number(match[3]);
    const date = new Date(year, month, day);
    return Number.isNaN(date.getTime()) ? null : date;
  }
  const parsed = new Date(text);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function documentSortTime(doc) {
  const fromBill = parseBillDate(doc.billDate);
  if (fromBill) return fromBill.getTime();
  const fromInvoice = parseBillDate(doc.invoiceDate);
  if (fromInvoice) return fromInvoice.getTime();
  if (doc.updatedAt) return new Date(doc.updatedAt).getTime();
  if (doc.createdAt) return new Date(doc.createdAt).getTime();
  return 0;
}

/**
 * Latest purchase invoice line sales rate for a product (by invoice date, then updatedAt).
 */
export async function findLatestPurchaseInvoiceSalesRate(productCode) {
  const code = String(productCode ?? '').trim();
  if (!code) {
    return { productCode: code, salesRate: null, formattedDocNo: null };
  }

  const codeLower = code.toLowerCase();
  const invoices = await PurchaseInvoice.find({ status: { $nin: ['cancelled', 'draft'] } })
    .select('lines billDate invoiceDate formattedDocNo updatedAt createdAt')
    .sort({ updatedAt: -1 })
    .limit(200)
    .lean();

  invoices.sort((a, b) => documentSortTime(b) - documentSortTime(a));

  for (const inv of invoices) {
    const line = (inv.lines || []).find(
      (l) => String(l.productRetailCode ?? '').trim().toLowerCase() === codeLower
    );
    const rate = parseRate(line?.salesRate);
    if (rate > 0) {
      return {
        productCode: code,
        salesRate: String(rate),
        formattedDocNo: inv.formattedDocNo ?? null,
        billDate: inv.billDate ?? inv.invoiceDate ?? null
      };
    }
  }

  return { productCode: code, salesRate: null, formattedDocNo: null, billDate: null };
}
