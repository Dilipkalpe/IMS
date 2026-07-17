import { isKnownTransactionType, partyKindForTransactionType } from '../constants/transactionTypes.js';
import { emptyReportLayout, validateLayoutJson, LAYOUT_SCHEMA_VERSION } from '../constants/layoutSchema.js';
import * as reportFormatRepo from '../repositories/reportFormatRepository.js';
import * as paperSizeRepo from '../repositories/paperSizeRepository.js';
import * as partyPrefRepo from '../repositories/partyPreferenceRepository.js';
import { ensureReportingDefaults } from './reportingSeedService.js';

function toDto(doc) {
  if (!doc) return null;
  return {
    id: String(doc._id),
    formatCode: doc.formatCode,
    formatName: doc.formatName,
    transactionType: doc.transactionType,
    paperSizeKey: doc.paperSizeKey,
    orientation: doc.orientation,
    customPaper: doc.customPaper ?? null,
    isDefault: doc.isDefault,
    isActive: doc.isActive,
    layoutJson: doc.layoutJson,
    schemaVersion: doc.schemaVersion,
    printSettings: doc.printSettings,
    visibilityOptions: doc.visibilityOptions,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt
  };
}

export async function listReportFormats(opts) {
  let rows = await reportFormatRepo.findReportFormats(opts);
  if (rows.length === 0 && !opts?.transactionType && !opts?.includeInactive) {
    await ensureReportingDefaults();
    rows = await reportFormatRepo.findReportFormats(opts);
  }
  return rows.map(toDto);
}

export async function getReportFormatById(id) {
  return toDto(await reportFormatRepo.findReportFormatById(id));
}

export async function resolveReportFormat({ transactionType, partyCode, partyKind }) {
  const tx = String(transactionType).trim().toLowerCase();
  if (!isKnownTransactionType(tx)) {
    const err = new Error(`Unknown transactionType: ${tx}`);
    err.status = 400;
    throw err;
  }

  let format = null;
  let source = 'default';

  const kind = partyKind || partyKindForTransactionType(tx);

  if (partyCode && kind === 'customer') {
    const pref = await partyPrefRepo.findCustomerPreference(partyCode, tx);
    if (pref?.reportFormatId) {
      format = await reportFormatRepo.findReportFormatById(pref.reportFormatId);
      source = 'customer';
    }
  }

  if (!format && partyCode && kind === 'supplier') {
    const pref = await partyPrefRepo.findSupplierPreference(partyCode, tx);
    if (pref?.reportFormatId) {
      format = await reportFormatRepo.findReportFormatById(pref.reportFormatId);
      source = 'supplier';
    }
  }

  if (!format || !format.isActive) {
    format = await reportFormatRepo.findDefaultReportFormat(tx);
    source = 'default';
  }

  if (!format) {
    return { source: 'none', format: null };
  }

  const paper = await paperSizeRepo.findPaperSizeByKey(format.paperSizeKey);
  return {
    source,
    transactionType: tx,
    partyCode: partyCode ?? null,
    partyKind: kind,
    format: toDto(format),
    paperSize: paper,
    effectivePage: resolveEffectivePage(format, paper)
  };
}

function resolveEffectivePage(format, paper) {
  const custom = format.customPaper;
  return {
    widthMm: custom?.widthMm ?? paper?.widthMm ?? 210,
    heightMm: custom?.heightMm ?? paper?.heightMm ?? 297,
    marginsMm: custom?.marginsMm ?? paper?.marginsMm ?? { top: 10, right: 10, bottom: 10, left: 10 },
    orientation: format.orientation ?? paper?.orientation ?? 'portrait',
    isThermal: paper?.isThermal ?? false
  };
}

export async function createReportFormat(payload, user) {
  const tx = String(payload.transactionType).trim().toLowerCase();
  if (!isKnownTransactionType(tx)) {
    const err = new Error('Invalid transactionType.');
    err.status = 400;
    throw err;
  }

  const paper = await paperSizeRepo.findPaperSizeByKey(payload.paperSizeKey ?? 'A4_PORTRAIT');
  const layoutJson = validateLayoutJson(
    payload.layoutJson ?? emptyReportLayout(paper)
  );

  if (payload.isDefault) {
    await reportFormatRepo.clearDefaultForTransactionType(tx);
  }

  const doc = await reportFormatRepo.createReportFormat({
    formatCode: String(payload.formatCode).trim().toUpperCase(),
    formatName: String(payload.formatName).trim(),
    transactionType: tx,
    paperSizeKey: payload.paperSizeKey ?? 'A4_PORTRAIT',
    orientation: payload.orientation ?? 'portrait',
    customPaper: payload.customPaper,
    isDefault: Boolean(payload.isDefault),
    isActive: payload.isActive !== false,
    layoutJson,
    schemaVersion: LAYOUT_SCHEMA_VERSION,
    printSettings: payload.printSettings ?? {},
    visibilityOptions: payload.visibilityOptions ?? {},
    updatedBy: user?.username ?? ''
  });

  return toDto(doc);
}

export async function updateReportFormat(id, payload, user) {
  const existing = await reportFormatRepo.findReportFormatById(id);
  if (!existing) {
    const err = new Error('Report format not found.');
    err.status = 404;
    throw err;
  }

  const patch = { updatedBy: user?.username ?? '' };
  if (payload.formatName !== undefined) patch.formatName = String(payload.formatName).trim();
  if (payload.paperSizeKey !== undefined) patch.paperSizeKey = payload.paperSizeKey;
  if (payload.orientation !== undefined) patch.orientation = payload.orientation;
  if (payload.customPaper !== undefined) patch.customPaper = payload.customPaper;
  if (payload.isActive !== undefined) patch.isActive = payload.isActive;
  if (payload.printSettings !== undefined) patch.printSettings = payload.printSettings;
  if (payload.visibilityOptions !== undefined) patch.visibilityOptions = payload.visibilityOptions;
  if (payload.layoutJson !== undefined) {
    patch.layoutJson = validateLayoutJson(payload.layoutJson);
    patch.schemaVersion = LAYOUT_SCHEMA_VERSION;
  }

  if (payload.isDefault) {
    await reportFormatRepo.clearDefaultForTransactionType(existing.transactionType);
    patch.isDefault = true;
  } else if (payload.isDefault === false) {
    patch.isDefault = false;
  }

  return toDto(await reportFormatRepo.updateReportFormatById(id, patch));
}

export async function deleteReportFormat(id) {
  const existing = await reportFormatRepo.findReportFormatById(id);
  if (!existing) {
    const err = new Error('Report format not found.');
    err.status = 404;
    throw err;
  }
  if (existing.isSystem) {
    const err = new Error('System formats cannot be deleted.');
    err.status = 400;
    throw err;
  }
  await reportFormatRepo.deleteReportFormatById(id);
  return { success: true };
}
