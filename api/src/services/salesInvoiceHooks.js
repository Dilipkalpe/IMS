import {
  applySalesInvoiceFulfillment,
  collectDcReferencesFromLines,
  invoiceHasDcSourceLines,
  refreshInvoicingForDeliveryChallans,
  validateSalesInvoiceLines
} from './deliveryChallanInvoicing.js';

function dcKeysFromLines(lines) {
  const refs = collectDcReferencesFromLines(lines);
  return refs.map((r) => `${r.docPrefix}|${r.docNo}`);
}

export const salesInvoiceHooks = {
  resolveStockDirection(payload) {
    return invoiceHasDcSourceLines(payload) ? 'none' : 'out';
  },

  async beforeCreate(payload) {
    await validateSalesInvoiceLines(payload);
  },

  async afterCreate(item) {
    await applySalesInvoiceFulfillment(item);
  },

  async beforeUpdate(existing, payload) {
    await validateSalesInvoiceLines(payload, { excludeInvId: existing._id });
  },

  async afterUpdate(existing, item) {
    const keys = new Set([...dcKeysFromLines(existing.lines), ...dcKeysFromLines(item.lines)]);
    await refreshInvoicingForDeliveryChallans([...keys]);
  },

  async afterDelete(item) {
    const keys = dcKeysFromLines(item.lines);
    await refreshInvoicingForDeliveryChallans(keys);
  }
};
