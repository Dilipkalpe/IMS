import { Quotation } from '../models/Quotation.js';
import { peekNextSequence } from '../models/Counter.js';

/** @param {string | undefined | null} prefix */
export function normalizeQtPrefix(prefix) {
  const raw = String(prefix ?? 'QT').trim().toUpperCase();
  const cleaned = raw.replace(/[^A-Z0-9_-]/g, '');
  return cleaned.length > 0 ? cleaned.slice(0, 12) : 'QT';
}

/** @param {string | undefined | null} prefix */
export function quotationCounterKey(prefix) {
  return `quotation:${normalizeQtPrefix(prefix)}`;
}

/** @param {string | undefined | null} prefix */
export function initialDocNoForPrefix(prefix, legacyQtInitial = 1) {
  return normalizeQtPrefix(prefix) === 'QT' ? legacyQtInitial : 1;
}

/** @param {string | undefined | null} prefix @param {number} docNo */
export function formatQuotationNo(prefix, docNo) {
  return `${normalizeQtPrefix(prefix)}-${docNo}`;
}

export async function peekNextQuotationDocNo(prefix, legacyQtInitial = 1) {
  const qtPrefix = normalizeQtPrefix(prefix);
  const initial = initialDocNoForPrefix(qtPrefix, legacyQtInitial);
  const key = quotationCounterKey(qtPrefix);
  const fromCounter = await peekNextSequence(key, initial);

  const latest = await Quotation.findOne({ qtPrefix })
    .sort({ docNo: -1 })
    .select('docNo')
    .lean();

  const fromDocs = latest?.docNo ? latest.docNo + 1 : initial;
  return Math.max(fromCounter, fromDocs);
}

/** @param {string | undefined | null} formatted */
export function parseFormattedQuotationNo(formatted) {
  const value = String(formatted ?? '').trim();
  if (!value) return { qtPrefix: 'QT', docNo: 0 };

  const dash = value.lastIndexOf('-');
  if (dash <= 0) {
    const num = Number(value);
    return {
      qtPrefix: 'QT',
      docNo: Number.isNaN(num) ? 0 : num
    };
  }

  const prefixPart = value.slice(0, dash);
  const num = Number(value.slice(dash + 1));
  return {
    qtPrefix: normalizeQtPrefix(prefixPart),
    docNo: Number.isNaN(num) ? 0 : num
  };
}
