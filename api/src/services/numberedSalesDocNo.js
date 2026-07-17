import { peekNextSequence } from '../models/Counter.js';
import { normalizeSoPrefix } from './salesOrderNo.js';

export { normalizeSoPrefix as normalizeDocPrefix };

export function formatPrefixDocNo(docPrefix, docNo) {
  return `${normalizeSoPrefix(docPrefix)}-${docNo}`;
}

export function parseFormattedDocNo(formatted, defaultPrefix = 'DOC') {
  const value = String(formatted ?? '').trim();
  if (!value) return { docPrefix: normalizeSoPrefix(defaultPrefix), docNo: 0 };

  const dash = value.lastIndexOf('-');
  if (dash <= 0) {
    const num = Number(value);
    return { docPrefix: normalizeSoPrefix(defaultPrefix), docNo: Number.isNaN(num) ? 0 : num };
  }

  return {
    docPrefix: normalizeSoPrefix(value.slice(0, dash)),
    docNo: Number(value.slice(dash + 1)) || 0
  };
}

export function salesDocCounterKey(counterNamespace, prefix, defaultPrefix) {
  return `${counterNamespace}:${normalizeSoPrefix(prefix || defaultPrefix)}`;
}

export function initialDocNoForDefaultPrefix(prefix, defaultPrefix, legacyInitial) {
  return normalizeSoPrefix(prefix) === normalizeSoPrefix(defaultPrefix) ? legacyInitial : 1;
}

/** Preview next number for a prefix (does not consume the sequence). */
export async function peekNextNumberedDoc(Model, counterNamespace, prefix, defaultPrefix, legacyInitial) {
  const docPrefix = normalizeSoPrefix(prefix || defaultPrefix);
  const initial = initialDocNoForDefaultPrefix(docPrefix, defaultPrefix, legacyInitial);
  const key = salesDocCounterKey(counterNamespace, docPrefix, defaultPrefix);
  const fromCounter = await peekNextSequence(key, initial);

  const latest = await Model.findOne({ docPrefix })
    .sort({ docNo: -1 })
    .select('docNo')
    .lean();

  const fromOrders = latest?.docNo ? latest.docNo + 1 : initial;
  return { docPrefix, docNo: Math.max(fromCounter, fromOrders) };
}

export function resolveInitialDocNo(docTypeKey) {
  const map = {
    delivery_challan: 1200,
    sales_invoice: 5500,
    sales_return: 301
  };
  return map[docTypeKey] ?? 1;
}
