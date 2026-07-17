import { SALES_PURCHASE_SETTINGS_KEY, SystemSettings } from '../models/SystemSettings.js';

export const SALES_RATE_SOURCES = ['product_master', 'purchase_invoice'];

export function normalizeSalesRateSource(value) {
  const key = String(value ?? '').trim().toLowerCase();
  return SALES_RATE_SOURCES.includes(key) ? key : 'product_master';
}

export async function getSalesPurchaseSettings() {
  let doc = await SystemSettings.findOne({ key: SALES_PURCHASE_SETTINGS_KEY }).lean();
  if (!doc) {
    doc = (
      await SystemSettings.create({
        key: SALES_PURCHASE_SETTINGS_KEY,
        salesRateSource: 'product_master'
      })
    ).toObject();
  }

  return {
    salesRateSource: normalizeSalesRateSource(doc.salesRateSource)
  };
}

export async function updateSalesPurchaseSettings({ salesRateSource }) {
  const normalized = normalizeSalesRateSource(salesRateSource);
  const doc = await SystemSettings.findOneAndUpdate(
    { key: SALES_PURCHASE_SETTINGS_KEY },
    { key: SALES_PURCHASE_SETTINGS_KEY, salesRateSource: normalized },
    { new: true, upsert: true, runValidators: true }
  ).lean();

  return {
    salesRateSource: normalizeSalesRateSource(doc.salesRateSource)
  };
}
