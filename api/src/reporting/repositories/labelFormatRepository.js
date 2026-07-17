import { LabelFormat } from '../models/LabelFormat.js';

export async function findLabelFormats({ labelType, includeInactive = false } = {}) {
  const filter = includeInactive ? {} : { isActive: true };
  if (labelType) filter.labelType = labelType;
  return LabelFormat.find(filter).sort({ labelName: 1 }).lean();
}

export async function findLabelFormatById(id) {
  return LabelFormat.findById(id).lean();
}

export async function findDefaultLabelFormat(labelType) {
  return LabelFormat.findOne({ labelType, isDefault: true, isActive: true }).lean();
}

export async function createLabelFormat(doc) {
  return LabelFormat.create(doc);
}

export async function updateLabelFormatById(id, patch) {
  return LabelFormat.findByIdAndUpdate(id, { $set: patch }, { new: true }).lean();
}
