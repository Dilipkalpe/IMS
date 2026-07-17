export {
  formatPrefixDocNo,
  parseFormattedDocNo,
  peekNextNumberedDoc,
  salesDocCounterKey as purchaseDocCounterKey,
  initialDocNoForDefaultPrefix,
  normalizeDocPrefix
} from './numberedSalesDocNo.js';

export function resolveInitialPurchaseDocNo(docTypeKey) {
  const map = {
    purchase_order: 1040,
    grn: 880,
    purchase_invoice: 2200,
    purchase_return: 101
  };
  return map[docTypeKey] ?? 1;
}
