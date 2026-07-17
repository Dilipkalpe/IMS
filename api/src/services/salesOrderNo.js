import { SalesOrder } from '../models/SalesOrder.js';
import { peekNextSequence } from '../models/Counter.js';

/** @param {string | undefined | null} prefix */
export function normalizeSoPrefix(prefix) {
  const raw = String(prefix ?? 'SO').trim().toUpperCase();
  const cleaned = raw.replace(/[^A-Z0-9_-]/g, '');
  return cleaned.length > 0 ? cleaned.slice(0, 12) : 'SO';
}

/** @param {string | undefined | null} prefix */
export function salesOrderCounterKey(prefix) {
  return `sales_order:${normalizeSoPrefix(prefix)}`;
}

/** First number for a new prefix counter (SO keeps legacy start; others start at 1). */
export function initialDocNoForPrefix(prefix, legacySoInitial = 2640) {
  return normalizeSoPrefix(prefix) === 'SO' ? legacySoInitial : 1;
}

/** @param {string | undefined | null} prefix @param {number} docNo */
export function formatSalesOrderNo(prefix, docNo) {
  return `${normalizeSoPrefix(prefix)}-${docNo}`;
}

/** Preview next sales order number for a prefix (does not consume the sequence). */
export async function peekNextSalesOrderDocNo(prefix, legacySoInitial = 2640) {
  const soPrefix = normalizeSoPrefix(prefix);
  const initial = initialDocNoForPrefix(soPrefix, legacySoInitial);
  const key = salesOrderCounterKey(soPrefix);
  const fromCounter = await peekNextSequence(key, initial);

  const latest = await SalesOrder.findOne({ soPrefix })
    .sort({ docNo: -1 })
    .select('docNo')
    .lean();

  const fromOrders = latest?.docNo ? latest.docNo + 1 : initial;
  return Math.max(fromCounter, fromOrders);
}

/** @param {string | undefined | null} formatted */
export function parseFormattedSalesOrderNo(formatted) {
  const value = String(formatted ?? '').trim();
  if (!value) return { soPrefix: 'SO', docNo: 0 };

  const dash = value.lastIndexOf('-');
  if (dash <= 0) {
    const num = Number(value);
    return {
      soPrefix: 'SO',
      docNo: Number.isNaN(num) ? 0 : num
    };
  }

  const prefixPart = value.slice(0, dash);
  const num = Number(value.slice(dash + 1));
  return {
    soPrefix: normalizeSoPrefix(prefixPart),
    docNo: Number.isNaN(num) ? 0 : num
  };
}
