import { ReportFieldRegistry } from '../models/ReportFieldRegistry.js';

export async function findFieldsForTransactionType(transactionType) {
  const tx = String(transactionType).trim().toLowerCase();
  return ReportFieldRegistry.find({
    isActive: true,
    transactionTypes: { $in: [tx, '*'] }
  })
    .sort({ sortOrder: 1, displayLabel: 1 })
    .lean();
}

export async function upsertFieldRegistry(entry) {
  return ReportFieldRegistry.findOneAndUpdate(
    { fieldKey: entry.fieldKey },
    { $set: entry },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  ).lean();
}
