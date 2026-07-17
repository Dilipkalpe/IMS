import { Account } from '../models/Account.js';
import { SalesBillTemplate } from '../models/SalesBillTemplate.js';
import { getCatalogPayload, getTransactionType } from '../catalog/billFormatCatalog.js';
import {
  DEFAULT_SALES_BILL_TEMPLATES,
  DEFAULT_PURCHASE_BILL_TEMPLATES,
  LAYOUT_VERSION,
  normalizeLayoutJson
} from '../catalog/billFormatTemplateDefaults.js';

export { getCatalogPayload };

function toDto(doc) {
  if (!doc) return null;
  const o = doc.toObject ? doc.toObject() : doc;
  return {
    id: String(o._id),
    templateKey: o.templateKey,
    formatCode: o.formatCode || String(o.templateKey || '').toUpperCase(),
    transactionType: o.transactionType || o.appliesToDocTypes?.[0] || 'sales_invoice',
    name: o.name,
    description: o.description ?? '',
    appliesToDocTypes: o.appliesToDocTypes ?? [],
    isSystem: Boolean(o.isSystem),
    isDefault: Boolean(o.isDefault),
    isActive: Boolean(o.isActive),
    printSettings: o.printSettings ?? {},
    visibilityRules: o.visibilityRules ?? {},
    layoutJson: o.layoutJson,
    version: o.version ?? LAYOUT_VERSION,
    updatedBy: o.updatedBy ?? '',
    createdAt: o.createdAt,
    updatedAt: o.updatedAt
  };
}

function normalizeDocType(docTypeKey) {
  return String(docTypeKey ?? '').trim().toLowerCase();
}

async function clearDefaultsForDocType(docTypeKey, exceptId = null) {
  const docKey = normalizeDocType(docTypeKey);
  const filter = {
    isDefault: true,
    appliesToDocTypes: docKey
  };
  if (exceptId) filter._id = { $ne: exceptId };
  await SalesBillTemplate.updateMany(filter, { $set: { isDefault: false } });
}

export async function listBillFormats({ transactionType, includeInactive } = {}) {
  const filter = includeInactive ? {} : { isActive: true };
  if (transactionType) {
    const key = normalizeDocType(transactionType);
    filter.$or = [{ transactionType: key }, { appliesToDocTypes: key }];
  }
  const docs = await SalesBillTemplate.find(filter)
    .sort({ transactionType: 1, isDefault: -1, name: 1 })
    .lean();
  return docs.map((d) => toDto(d));
}

export async function getBillFormatById(id) {
  const doc = await SalesBillTemplate.findById(id);
  return toDto(doc);
}

export async function getBillFormatByKey(templateKeyOrCode) {
  const raw = String(templateKeyOrCode ?? '').trim();
  if (!raw) return null;
  const key = raw.toLowerCase();
  let doc = await SalesBillTemplate.findOne({ templateKey: key, isActive: true });
  if (!doc) {
    doc = await SalesBillTemplate.findOne({
      isActive: true,
      formatCode: raw.toUpperCase()
    });
  }
  return toDto(doc);
}

export async function getDefaultBillFormat(docTypeKey) {
  const docKey = normalizeDocType(docTypeKey);

  let doc = await SalesBillTemplate.findOne({
    isActive: true,
    isDefault: true,
    appliesToDocTypes: docKey
  }).sort({ updatedAt: -1 });

  if (!doc) {
    doc = await SalesBillTemplate.findOne({
      isActive: true,
      transactionType: docKey,
      isDefault: true
    }).sort({ updatedAt: -1 });
  }

  if (!doc) {
    doc = await SalesBillTemplate.findOne({
      isActive: true,
      appliesToDocTypes: docKey
    }).sort({ isDefault: -1, updatedAt: -1 });
  }

  if (!doc) {
    doc = await SalesBillTemplate.findOne({ isActive: true, templateKey: 'default' });
  }

  return toDto(doc);
}

/**
 * Resolve print format: party assignment → default for doc type.
 */
export async function resolveBillFormat({ docTypeKey, partyCode, accountType }) {
  const docKey = normalizeDocType(docTypeKey);
  const tx = getTransactionType(docKey);
  const assignmentField = tx?.assignmentField;

  if (partyCode && assignmentField) {
    const code = String(partyCode).trim().toUpperCase();
    const typeFilter = accountType
      ? { accountType: String(accountType).trim().toLowerCase() }
      : {};
    const account = await Account.findOne({ code, ...typeFilter }).lean();
    const assignments = account?.billFormatAssignments ?? {};
    const assignedKey = assignments[assignmentField] || assignments[docKey];
    if (assignedKey) {
      const assigned = await getBillFormatByKey(assignedKey);
      if (assigned) {
        return {
          source: 'party_assignment',
          docTypeKey: docKey,
          partyCode: code,
          template: assigned
        };
      }
    }
  }

  const template = await getDefaultBillFormat(docKey);
  return {
    source: template ? 'default' : 'none',
    docTypeKey: docKey,
    partyCode: partyCode ? String(partyCode).trim().toUpperCase() : null,
    template
  };
}

export async function ensureDefaultBillFormats() {
  let created = 0;
  const allSeeds = [...DEFAULT_SALES_BILL_TEMPLATES, ...DEFAULT_PURCHASE_BILL_TEMPLATES];

  for (const seed of allSeeds) {
    const layoutJson = normalizeLayoutJson(seed.layoutJson);
    const existing = await SalesBillTemplate.findOne({ templateKey: seed.templateKey });
    if (existing) {
      const patch = {};
      if (!existing.transactionType) patch.transactionType = seed.transactionType;
      if (!existing.formatCode) patch.formatCode = seed.formatCode;
      if (!existing.layoutJson?.sections?.length) {
        patch.layoutJson = layoutJson;
        patch.version = LAYOUT_VERSION;
      }
      if (Object.keys(patch).length) await SalesBillTemplate.updateOne({ _id: existing._id }, { $set: patch });
      continue;
    }
    await SalesBillTemplate.create({
      ...seed,
      layoutJson,
      version: LAYOUT_VERSION
    });
    created++;
  }

  for (const docKey of [
    'sales_invoice',
    'sales_order',
    'sales_return',
    'delivery_challan',
    'purchase_invoice',
    'purchase_order',
    'purchase_return',
    'grn'
  ]) {
    const count = await SalesBillTemplate.countDocuments({
      isActive: true,
      isDefault: true,
      appliesToDocTypes: docKey
    });
    if (count === 0) {
      const fallback = await SalesBillTemplate.findOne({ appliesToDocTypes: docKey, isActive: true }).sort({
        isSystem: -1,
        name: 1
      });
      if (fallback) {
        await clearDefaultsForDocType(docKey);
        fallback.isDefault = true;
        await fallback.save();
      }
    }
  }

  return { created, total: allSeeds.length };
}

export async function createBillFormat(payload, updatedBy = '') {
  const templateKey = String(payload.templateKey ?? payload.formatCode ?? '')
    .trim()
    .toLowerCase();
  if (!templateKey) throw Object.assign(new Error('templateKey / formatCode is required.'), { status: 400 });
  if (!/^[a-z0-9_-]{2,64}$/.test(templateKey)) {
    throw Object.assign(new Error('templateKey must be 2–64 lowercase letters, numbers, _ or -.'), {
      status: 400
    });
  }

  const exists = await SalesBillTemplate.findOne({ templateKey });
  if (exists) throw Object.assign(new Error('Template key already exists.'), { status: 409 });

  const transactionType = normalizeDocType(
    payload.transactionType ?? payload.appliesToDocTypes?.[0] ?? 'sales_invoice'
  );
  const appliesToDocTypes = Array.isArray(payload.appliesToDocTypes)
    ? payload.appliesToDocTypes.map(normalizeDocType).filter(Boolean)
    : [transactionType];

  const layoutJson = normalizeLayoutJson(
    payload.layoutJson ?? DEFAULT_SALES_BILL_TEMPLATES[0].layoutJson
  );

  const doc = await SalesBillTemplate.create({
    templateKey,
    formatCode: String(payload.formatCode ?? templateKey).trim().toUpperCase(),
    transactionType,
    name: String(payload.name ?? templateKey).trim() || templateKey,
    description: String(payload.description ?? '').trim(),
    appliesToDocTypes,
    isSystem: false,
    isDefault: Boolean(payload.isDefault),
    isActive: payload.isActive !== false,
    printSettings: payload.printSettings ?? {},
    visibilityRules: payload.visibilityRules ?? {},
    layoutJson,
    version: LAYOUT_VERSION,
    updatedBy
  });

  if (doc.isDefault) {
    for (const dt of appliesToDocTypes) {
      await clearDefaultsForDocType(dt, doc._id);
    }
    await SalesBillTemplate.updateOne({ _id: doc._id }, { $set: { isDefault: true } });
  }

  return toDto(doc);
}

export async function updateBillFormat(id, payload, updatedBy = '') {
  const doc = await SalesBillTemplate.findById(id);
  if (!doc) throw Object.assign(new Error('Template not found.'), { status: 404 });

  if (payload.name !== undefined) doc.name = String(payload.name).trim() || doc.name;
  if (payload.description !== undefined) doc.description = String(payload.description).trim();
  if (payload.formatCode !== undefined) doc.formatCode = String(payload.formatCode).trim().toUpperCase();
  if (payload.transactionType !== undefined) {
    doc.transactionType = normalizeDocType(payload.transactionType);
  }
  if (payload.appliesToDocTypes !== undefined) {
    doc.appliesToDocTypes = Array.isArray(payload.appliesToDocTypes)
      ? payload.appliesToDocTypes.map(normalizeDocType).filter(Boolean)
      : doc.appliesToDocTypes;
  }
  if (payload.isActive !== undefined) doc.isActive = Boolean(payload.isActive);
  if (payload.printSettings !== undefined) doc.printSettings = payload.printSettings;
  if (payload.visibilityRules !== undefined) doc.visibilityRules = payload.visibilityRules;
  if (payload.layoutJson !== undefined) {
    doc.layoutJson = normalizeLayoutJson(payload.layoutJson);
    doc.version = Number(payload.layoutJson?.version) || LAYOUT_VERSION;
  }

  if (payload.isDefault === true) {
    const docTypes = doc.appliesToDocTypes?.length ? doc.appliesToDocTypes : [doc.transactionType];
    for (const dt of docTypes) {
      await clearDefaultsForDocType(dt, doc._id);
    }
    doc.isDefault = true;
  } else if (payload.isDefault === false) {
    doc.isDefault = false;
  }

  if (updatedBy) doc.updatedBy = updatedBy;
  await doc.save();
  return toDto(doc);
}

export async function updateBillFormatLayout(id, layoutJson, updatedBy = '') {
  return updateBillFormat(id, { layoutJson }, updatedBy);
}

export async function deleteBillFormat(id) {
  const doc = await SalesBillTemplate.findById(id);
  if (!doc) throw Object.assign(new Error('Template not found.'), { status: 404 });
  if (doc.isSystem) {
    throw Object.assign(new Error('System templates cannot be deleted. Duplicate to customize.'), {
      status: 403
    });
  }
  if (doc.isDefault) {
    throw Object.assign(
      new Error('Cannot delete the default template. Set another template as default first.'),
      { status: 400 }
    );
  }
  await doc.deleteOne();
  return { deleted: true, id: String(doc._id) };
}

export async function duplicateBillFormat(id, newKey, newName, updatedBy = '') {
  const source = await SalesBillTemplate.findById(id);
  if (!source) throw Object.assign(new Error('Template not found.'), { status: 404 });

  return createBillFormat(
    {
      templateKey: newKey,
      formatCode: String(newKey).toUpperCase(),
      name: newName || `${source.name} (Copy)`,
      description: source.description,
      transactionType: source.transactionType,
      appliesToDocTypes: source.appliesToDocTypes,
      isDefault: false,
      printSettings: JSON.parse(JSON.stringify(source.printSettings ?? {})),
      visibilityRules: JSON.parse(JSON.stringify(source.visibilityRules ?? {})),
      layoutJson: JSON.parse(JSON.stringify(source.layoutJson))
    },
    updatedBy
  );
}

export async function exportBillFormatJson(id) {
  const template = await getBillFormatById(id);
  if (!template) throw Object.assign(new Error('Template not found.'), { status: 404 });
  return template;
}

export async function importBillFormatJson(payload, updatedBy = '') {
  return createBillFormat(payload, updatedBy);
}
