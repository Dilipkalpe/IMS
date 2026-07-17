import {
  applyDeliveryChallanFulfillment,
  collectSoReferencesFromLines,
  refreshFulfillmentForSalesOrders,
  validateDeliveryChallanLines
} from './salesOrderFulfillment.js';

function soKeysFromLines(lines) {
  const refs = collectSoReferencesFromLines(lines);
  return refs.map((r) => `${r.soPrefix}|${r.docNo}`);
}

export const deliveryChallanHooks = {
  async beforeCreate(payload) {
    await validateDeliveryChallanLines(payload);
  },

  async afterCreate(item) {
    await applyDeliveryChallanFulfillment(item);
  },

  async beforeUpdate(existing, payload) {
    await validateDeliveryChallanLines(payload, { excludeDcId: existing._id });
  },

  async afterUpdate(existing, item) {
    const keys = new Set([
      ...soKeysFromLines(existing.lines),
      ...soKeysFromLines(item.lines)
    ]);
    await refreshFulfillmentForSalesOrders([...keys]);
  },

  async afterDelete(item) {
    const keys = soKeysFromLines(item.lines);
    await refreshFulfillmentForSalesOrders(keys);
  }
};
