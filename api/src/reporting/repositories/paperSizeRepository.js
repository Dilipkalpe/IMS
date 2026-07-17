import { PaperSize } from '../models/PaperSize.js';

export async function findAllPaperSizes() {
  return PaperSize.find({ isActive: true }).sort({ name: 1 }).lean();
}

export async function findPaperSizeByKey(key) {
  return PaperSize.findOne({ key: String(key).trim().toUpperCase(), isActive: true }).lean();
}

export async function upsertPaperSize(doc) {
  return PaperSize.findOneAndUpdate(
    { key: doc.key },
    { $set: doc },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  ).lean();
}
