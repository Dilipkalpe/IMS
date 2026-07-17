import * as paperRepo from '../repositories/paperSizeRepository.js';

export async function listPaperSizes() {
  return paperRepo.findAllPaperSizes();
}

export async function getPaperSize(key) {
  const doc = await paperRepo.findPaperSizeByKey(key);
  if (!doc) {
    const err = new Error('Paper size not found.');
    err.status = 404;
    throw err;
  }
  return doc;
}

export async function createOrUpdatePaperSize(payload) {
  return paperRepo.upsertPaperSize({
    key: String(payload.key).trim().toUpperCase(),
    name: String(payload.name).trim(),
    widthMm: Number(payload.widthMm),
    heightMm: Number(payload.heightMm),
    marginsMm: payload.marginsMm ?? { top: 10, right: 10, bottom: 10, left: 10 },
    orientation: payload.orientation ?? 'portrait',
    isThermal: Boolean(payload.isThermal),
    isSystem: payload.isSystem !== false,
    isActive: true
  });
}
