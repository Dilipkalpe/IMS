import {
  applyPurchaseInvoiceFulfillment,
  collectGrnReferencesFromLines,
  purchaseInvoiceHasGrnSourceLines,
  refreshInvoicingForGrns,
  validatePurchaseInvoiceLines
} from './grnInvoicing.js';

function grnKeysFromLines(lines) {
  const refs = collectGrnReferencesFromLines(lines);
  return refs.map((r) => `${r.docPrefix}|${r.docNo}`);
}

export const purchaseInvoiceHooks = {
  resolveStockDirection(payload) {
    return purchaseInvoiceHasGrnSourceLines(payload) ? 'none' : 'in';
  },

  async beforeCreate(payload) {
    await validatePurchaseInvoiceLines(payload);
  },

  async afterCreate(item) {
    await applyPurchaseInvoiceFulfillment(item);
  },

  async beforeUpdate(existing, payload) {
    await validatePurchaseInvoiceLines(payload, { excludePiId: existing._id });
  },

  async afterUpdate(existing, item) {
    const keys = new Set([...grnKeysFromLines(existing.lines), ...grnKeysFromLines(item.lines)]);
    await refreshInvoicingForGrns([...keys]);
  },

  async afterDelete(item) {
    const keys = grnKeysFromLines(item.lines);
    await refreshInvoicingForGrns(keys);
  }
};
