import { GridColumnGlobalDefault } from '../models/GridColumnGlobalDefault.js';
import { UserGridColumnPreference } from '../models/UserGridColumnPreference.js';
import {
  getCatalogForModule,
  getDefaultVisibleColumnKeys,
  isTransactionLineGridModule,
  normalizeVisibleColumnKeys
} from '../catalog/salesLineGridColumns.js';

async function getGlobalVisibleKeys(moduleKey) {
  const doc = await GridColumnGlobalDefault.findOne({ moduleKey }).lean();
  if (!doc?.visibleColumnKeys?.length) return null;
  return normalizeVisibleColumnKeys(doc.visibleColumnKeys, moduleKey);
}

async function getUserVisibleKeys(userId, moduleKey) {
  const doc = await UserGridColumnPreference.findOne({ userId, moduleKey }).lean();
  if (!doc?.visibleColumnKeys?.length) return null;
  return normalizeVisibleColumnKeys(doc.visibleColumnKeys, moduleKey);
}

export async function getEffectiveVisibleColumnKeys(userId, moduleKey) {
  const userKeys = await getUserVisibleKeys(userId, moduleKey);
  if (userKeys) return userKeys;

  const globalKeys = await getGlobalVisibleKeys(moduleKey);
  if (globalKeys) return globalKeys;

  return getDefaultVisibleColumnKeys(moduleKey);
}

export async function getGridColumnPreferences(userId, moduleKey) {
  const catalog = getCatalogForModule(moduleKey);
  const userDoc = await UserGridColumnPreference.findOne({ userId, moduleKey }).lean();
  const globalDoc = await GridColumnGlobalDefault.findOne({ moduleKey }).lean();
  const effective = await getEffectiveVisibleColumnKeys(userId, moduleKey);

  return {
    moduleKey,
    columns: catalog.columns,
    mandatoryColumnKeys: catalog.mandatoryColumnKeys,
    defaultVisibleColumnKeys: catalog.defaultVisibleColumnKeys,
    visibleColumnKeys: effective,
    hasUserOverride: Boolean(userDoc?.visibleColumnKeys?.length),
    hasGlobalDefault: Boolean(globalDoc?.visibleColumnKeys?.length),
    globalVisibleColumnKeys: globalDoc?.visibleColumnKeys?.length
      ? normalizeVisibleColumnKeys(globalDoc.visibleColumnKeys, moduleKey)
      : null,
    userVisibleColumnKeys: userDoc?.visibleColumnKeys?.length
      ? normalizeVisibleColumnKeys(userDoc.visibleColumnKeys, moduleKey)
      : null
  };
}

export async function saveUserGridColumnPreferences(userId, moduleKey, visibleColumnKeys) {
  if (!isTransactionLineGridModule(moduleKey)) {
    throw new Error(`Unknown grid module: ${moduleKey}`);
  }

  const normalized = normalizeVisibleColumnKeys(visibleColumnKeys, moduleKey);
  await UserGridColumnPreference.findOneAndUpdate(
    { userId, moduleKey },
    { visibleColumnKeys: normalized },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  return getGridColumnPreferences(userId, moduleKey);
}

export async function resetUserGridColumnPreferences(userId, moduleKey) {
  await UserGridColumnPreference.deleteOne({ userId, moduleKey });
  return getGridColumnPreferences(userId, moduleKey);
}

export async function saveGlobalGridColumnDefaults(moduleKey, visibleColumnKeys, adminUser) {
  if (!isTransactionLineGridModule(moduleKey)) {
    throw new Error(`Unknown grid module: ${moduleKey}`);
  }

  const normalized = normalizeVisibleColumnKeys(visibleColumnKeys, moduleKey);
  await GridColumnGlobalDefault.findOneAndUpdate(
    { moduleKey },
    {
      visibleColumnKeys: normalized,
      updatedBy: adminUser?.username || adminUser?.fullName || 'administrator',
      updatedByUserId: adminUser?.id ? String(adminUser.id) : ''
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  return {
    moduleKey,
    visibleColumnKeys: normalized
  };
}

export async function resetGlobalGridColumnDefaults(moduleKey) {
  await GridColumnGlobalDefault.deleteOne({ moduleKey });
  return {
    moduleKey,
    visibleColumnKeys: getDefaultVisibleColumnKeys()
  };
}

export function listSupportedModules() {
  return {
    modules: [
      { key: 'sales_order', title: 'Sales Order' },
      { key: 'sales_invoice', title: 'Sales Invoice' },
      { key: 'delivery_challan', title: 'Delivery Challan' },
      { key: 'sales_return', title: 'Sales Return' },
      { key: 'purchase_order', title: 'Purchase Order' },
      { key: 'grn', title: 'GRN' },
      { key: 'purchase_invoice', title: 'Purchase Invoice' },
      { key: 'purchase_return', title: 'Purchase Return' }
    ]
  };
}
