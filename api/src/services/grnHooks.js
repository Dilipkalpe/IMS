import {
  applyGrnFulfillment,
  collectPoReferencesFromLines,
  refreshFulfillmentForPurchaseOrders,
  validateGrnLines
} from './purchaseOrderFulfillment.js';

function poKeysFromLines(lines) {
  const refs = collectPoReferencesFromLines(lines);
  return refs.map((r) => `${r.docPrefix}|${r.docNo}`);
}

export const grnHooks = {
  async beforeCreate(payload) {
    await validateGrnLines(payload);
  },

  async afterCreate(item) {
    await applyGrnFulfillment(item);
  },

  async beforeUpdate(existing, payload) {
    await validateGrnLines(payload, { excludeGrnId: existing._id });
  },

  async afterUpdate(existing, item) {
    const keys = new Set([...poKeysFromLines(existing.lines), ...poKeysFromLines(item.lines)]);
    await refreshFulfillmentForPurchaseOrders([...keys]);
  },

  async afterDelete(item) {
    const keys = poKeysFromLines(item.lines);
    await refreshFulfillmentForPurchaseOrders(keys);
  }
};
