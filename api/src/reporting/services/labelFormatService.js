import { validateLayoutJson, LAYOUT_SCHEMA_VERSION } from '../constants/layoutSchema.js';
import * as labelRepo from '../repositories/labelFormatRepository.js';

function toDto(doc) {
  if (!doc) return null;
  return {
    id: String(doc._id),
    formatCode: doc.formatCode,
    labelName: doc.labelName,
    labelType: doc.labelType,
    widthMm: doc.widthMm,
    heightMm: doc.heightMm,
    printerType: doc.printerType,
    layoutJson: doc.layoutJson,
    isDefault: doc.isDefault,
    isActive: doc.isActive,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt
  };
}

export async function listLabelFormats(opts) {
  return (await labelRepo.findLabelFormats(opts)).map(toDto);
}

export async function getLabelFormatById(id) {
  return toDto(await labelRepo.findLabelFormatById(id));
}

export async function resolveLabelFormat(labelType) {
  const format = await labelRepo.findDefaultLabelFormat(String(labelType).trim().toLowerCase());
  return { source: format ? 'default' : 'none', format: toDto(format) };
}

export async function createLabelFormat(payload, user) {
  const layoutJson = validateLayoutJson(
    payload.layoutJson ?? {
      schemaVersion: LAYOUT_SCHEMA_VERSION,
      label: { widthMm: payload.widthMm, heightMm: payload.heightMm },
      elements: []
    }
  );

  const doc = await labelRepo.createLabelFormat({
    formatCode: String(payload.formatCode).trim().toUpperCase(),
    labelName: String(payload.labelName).trim(),
    labelType: String(payload.labelType).trim().toLowerCase(),
    widthMm: Number(payload.widthMm),
    heightMm: Number(payload.heightMm),
    printerType: payload.printerType ?? 'any',
    layoutJson,
    isDefault: Boolean(payload.isDefault),
    isActive: true,
    updatedBy: user?.username ?? ''
  });

  return toDto(doc);
}

export async function updateLabelFormat(id, payload, user) {
  const patch = { updatedBy: user?.username ?? '' };
  if (payload.labelName !== undefined) patch.labelName = payload.labelName;
  if (payload.layoutJson !== undefined) patch.layoutJson = validateLayoutJson(payload.layoutJson);
  if (payload.isActive !== undefined) patch.isActive = payload.isActive;
  return toDto(await labelRepo.updateLabelFormatById(id, patch));
}
