import { ReportFormat } from '../models/ReportFormat.js';

export async function findReportFormats({ transactionType, includeInactive = false } = {}) {
  const filter = includeInactive ? {} : { isActive: true };
  if (transactionType) filter.transactionType = transactionType;
  return ReportFormat.find(filter).sort({ formatName: 1 }).lean();
}

export async function findReportFormatById(id) {
  return ReportFormat.findById(id).lean();
}

export async function findReportFormatByCode(formatCode) {
  return ReportFormat.findOne({ formatCode: String(formatCode).trim().toUpperCase() }).lean();
}

export async function findDefaultReportFormat(transactionType) {
  return ReportFormat.findOne({ transactionType, isDefault: true, isActive: true }).lean();
}

export async function clearDefaultForTransactionType(transactionType) {
  await ReportFormat.updateMany({ transactionType }, { $set: { isDefault: false } });
}

export async function createReportFormat(doc) {
  return ReportFormat.create(doc);
}

export async function updateReportFormatById(id, patch) {
  return ReportFormat.findByIdAndUpdate(id, { $set: patch }, { new: true, runValidators: true }).lean();
}

export async function deleteReportFormatById(id) {
  return ReportFormat.findByIdAndDelete(id);
}
