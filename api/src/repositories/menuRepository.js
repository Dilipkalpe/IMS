import { MenuMaster } from '../models/MenuMaster.js';

export async function findAllMenus({ activeOnly = true } = {}) {
  const filter = activeOnly ? { isActive: { $ne: false } } : {};
  return MenuMaster.find(filter).sort({ menuOrder: 1, menuName: 1 }).lean();
}

export async function findMenuByKey(menuKey) {
  return MenuMaster.findOne({ menuKey }).lean();
}

export async function upsertMenuByKey(menuKey, data) {
  return MenuMaster.findOneAndUpdate(
    { menuKey },
    { $set: data },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  ).lean();
}

export async function findMenusByKeys(menuKeys) {
  return MenuMaster.find({ menuKey: { $in: menuKeys } }).lean();
}
