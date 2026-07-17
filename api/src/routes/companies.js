import { Router } from 'express';
import { getActiveYearDbName, getMongoUri, parseDbNameFromUri } from '../config/db.js';
import { getYearModel, getYearModelFromRequest, resolveYearDbName } from '../db/yearModels.js';
import { Company } from '../models/Company.js';
import { requireAuth } from '../middleware/requireAuth.js';
import {
  deleteCompanyLogoFiles,
  migrateInlineCompanyLogo,
  readCompanyLogoFile,
  renameCompanyLogoFiles,
  saveCompanyLogoFromInput,
  toCompanyLogoDto,
  isCompanyLogoUrl,
  companyLogoPublicPath,
} from '../services/companyLogoStorage.js';

const router = Router();

const LIST_PROJECTION =
  'code businessName address phone email gstin state placeOfSupply bankName bankAccountNo bankIfsc bankAccountHolder logoText logoImage isDefault activeStatus createdAt updatedAt';

function resolvePublicYearDb(req) {
  const fromQuery = String(req.query.yearDb ?? '').trim();
  if (fromQuery) return fromQuery;
  return getActiveYearDbName() || parseDbNameFromUri(getMongoUri());
}

function companyModelForRequest(req) {
  return getYearModelFromRequest(Company, req);
}

function toUpdatePayload(body) {
  const {
    _id,
    id,
    __v,
    createdAt,
    updatedAt,
    hasLogo,
    logoUrl,
    ...rest
  } = body ?? {};
  return rest;
}

async function clearOtherDefaults(CompanyModel, excludeId = null) {
  const filter = excludeId ? { _id: { $ne: excludeId } } : {};
  await CompanyModel.updateMany(filter, { isDefault: false });
}

async function applyLogoPayload(CompanyModel, code, payload) {
  if (!Object.prototype.hasOwnProperty.call(payload, 'logoImage')) {
    return;
  }
  payload.logoImage = await saveCompanyLogoFromInput(code, payload.logoImage);
}

async function applyCompanyCodeChange(oldCode, newCode, payload) {
  const from = String(oldCode ?? '').trim().toUpperCase();
  const to = String(newCode ?? '').trim().toUpperCase();
  if (!from || !to || from === to) return;

  const renamedUrl = await renameCompanyLogoFiles(from, to);
  if (renamedUrl && !Object.prototype.hasOwnProperty.call(payload, 'logoImage')) {
    payload.logoImage = renamedUrl;
  } else if (
    Object.prototype.hasOwnProperty.call(payload, 'logoImage') &&
    isCompanyLogoUrl(payload.logoImage)
  ) {
    payload.logoImage = companyLogoPublicPath(to);
  }
}

function serializeCompany(doc, { includeLogoFields = true } = {}) {
  const json = doc.toObject ? doc.toObject() : { ...doc };
  if (!includeLogoFields) {
    const logo = toCompanyLogoDto(json);
    delete json.logoImage;
    return { ...json, hasLogo: logo.hasLogo, logoUrl: logo.logoUrl };
  }
  const logo = toCompanyLogoDto(json);
  return {
    ...json,
    hasLogo: logo.hasLogo,
    logoUrl: logo.logoUrl,
    logoImage: logo.logoImage,
  };
}

async function findDefaultCompany(CompanyModel) {
  return (
    (await CompanyModel.findOne({ isDefault: true, activeStatus: true })) ??
    (await CompanyModel.findOne({ activeStatus: true }).sort({ createdAt: 1 }))
  );
}

/** Public branding for login/sidebar — minimal fields only. */
router.get('/branding', async (req, res, next) => {
  try {
    const CompanyModel = getYearModel(Company, resolvePublicYearDb(req));
    const item = await findDefaultCompany(CompanyModel);
    if (!item) return res.status(404).json({ error: 'No company registered' });

    await migrateInlineCompanyLogo(item);
    const logo = toCompanyLogoDto(item);

    res.json({
      businessName: item.businessName,
      logoText: item.logoText ?? '',
      hasLogo: logo.hasLogo,
      logoUrl: logo.logoUrl,
      updatedAt: item.updatedAt,
    });
  } catch (err) {
    next(err);
  }
});

router.get('/default', requireAuth, async (req, res, next) => {
  try {
    const CompanyModel = companyModelForRequest(req);
    const item = await findDefaultCompany(CompanyModel);
    if (!item) return res.status(404).json({ error: 'No company registered' });
    await migrateInlineCompanyLogo(item);
    res.json(serializeCompany(item));
  } catch (err) {
    next(err);
  }
});

router.get('/', requireAuth, async (req, res, next) => {
  try {
    const CompanyModel = companyModelForRequest(req);
    const { page = 1, limit = 100, search } = req.query;
    const filter = {};

    if (search) {
      const term = String(search).trim();
      filter.$or = [
        { code: new RegExp(term, 'i') },
        { businessName: new RegExp(term, 'i') },
        { gstin: new RegExp(term, 'i') },
      ];
    }

    const skip = (Number(page) - 1) * Number(limit);
    const [items, total] = await Promise.all([
      CompanyModel.find(filter)
        .select(LIST_PROJECTION)
        .sort({ isDefault: -1, businessName: 1 })
        .skip(skip)
        .limit(Number(limit)),
      CompanyModel.countDocuments(filter),
    ]);

    res.json({
      items: items.map((item) => serializeCompany(item, { includeLogoFields: false })),
      total,
      page: Number(page),
      limit: Number(limit),
    });
  } catch (err) {
    next(err);
  }
});

router.get('/by-code/:code/logo', async (req, res, next) => {
  try {
    const code = req.params.code.toUpperCase();
    const CompanyModel = req.financialYearDb
      ? getYearModel(Company, req.financialYearDb)
      : getYearModel(Company, resolvePublicYearDb(req));

    const item = await CompanyModel.findOne({ code });
    if (!item) return res.status(404).json({ error: 'Company not found' });

    await migrateInlineCompanyLogo(item);

    const file = await readCompanyLogoFile(code);
    if (!file) return res.status(404).json({ error: 'Company logo not found' });

    res.setHeader('Content-Type', file.mime);
    res.setHeader('Cache-Control', 'private, max-age=300');
    if (item.updatedAt) {
      res.setHeader('Last-Modified', new Date(item.updatedAt).toUTCString());
    }
    res.send(file.buffer);
  } catch (err) {
    next(err);
  }
});

router.get('/by-code/:code', requireAuth, async (req, res, next) => {
  try {
    const CompanyModel = companyModelForRequest(req);
    const item = await CompanyModel.findOne({ code: req.params.code.toUpperCase() });
    if (!item) return res.status(404).json({ error: 'Company not found' });
    await migrateInlineCompanyLogo(item);
    res.json(serializeCompany(item));
  } catch (err) {
    next(err);
  }
});

router.get('/:id', requireAuth, async (req, res, next) => {
  try {
    if (req.params.id === 'default' || req.params.id === 'branding') {
      return res.status(404).json({ error: 'Company not found' });
    }
    const CompanyModel = companyModelForRequest(req);
    const item = await CompanyModel.findById(req.params.id);
    if (!item) return res.status(404).json({ error: 'Company not found' });
    await migrateInlineCompanyLogo(item);
    res.json(serializeCompany(item));
  } catch (err) {
    next(err);
  }
});

router.post('/', requireAuth, async (req, res, next) => {
  try {
    const CompanyModel = companyModelForRequest(req);
    const payload = toUpdatePayload(req.body);
    const code = String(payload.code ?? '').trim().toUpperCase();
    if (!code) return res.status(400).json({ error: 'Company code is required.' });

    await applyLogoPayload(CompanyModel, code, payload);
    if (payload.isDefault) await clearOtherDefaults(CompanyModel);

    const item = await CompanyModel.create(payload);
    res.status(201).json(serializeCompany(item));
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({ error: 'Company code already exists' });
    }
    next(err);
  }
});

router.put('/by-code/:code', requireAuth, async (req, res, next) => {
  try {
    const CompanyModel = companyModelForRequest(req);
    const existing = await CompanyModel.findOne({ code: req.params.code.toUpperCase() });
    if (!existing) return res.status(404).json({ error: 'Company not found' });

    const payload = toUpdatePayload(req.body);
    const targetCode = String(payload.code ?? existing.code).trim().toUpperCase();
    await applyCompanyCodeChange(existing.code, targetCode, payload);
    await applyLogoPayload(CompanyModel, targetCode, payload);
    if (payload.isDefault) await clearOtherDefaults(CompanyModel, existing._id);

    const item = await CompanyModel.findOneAndUpdate(
      { code: req.params.code.toUpperCase() },
      payload,
      { new: true, runValidators: true },
    );
    res.json(serializeCompany(item));
  } catch (err) {
    next(err);
  }
});

router.put('/:id/set-default', requireAuth, async (req, res, next) => {
  try {
    const CompanyModel = companyModelForRequest(req);
    const item = await CompanyModel.findById(req.params.id);
    if (!item) return res.status(404).json({ error: 'Company not found' });

    await clearOtherDefaults(CompanyModel, item._id);
    item.isDefault = true;
    await item.save();
    res.json(serializeCompany(item));
  } catch (err) {
    next(err);
  }
});

router.put('/:id', requireAuth, async (req, res, next) => {
  try {
    const CompanyModel = companyModelForRequest(req);
    const existing = await CompanyModel.findById(req.params.id);
    if (!existing) return res.status(404).json({ error: 'Company not found' });

    const payload = toUpdatePayload(req.body);
    const targetCode = String(payload.code ?? existing.code).trim().toUpperCase();
    await applyCompanyCodeChange(existing.code, targetCode, payload);
    await applyLogoPayload(CompanyModel, targetCode, payload);
    if (payload.isDefault) await clearOtherDefaults(CompanyModel, req.params.id);

    const item = await CompanyModel.findByIdAndUpdate(req.params.id, payload, {
      new: true,
      runValidators: true,
    });
    res.json(serializeCompany(item));
  } catch (err) {
    next(err);
  }
});

router.delete('/by-code/:code', requireAuth, async (req, res, next) => {
  try {
    const CompanyModel = companyModelForRequest(req);
    const code = req.params.code.toUpperCase();
    const item = await CompanyModel.findOneAndDelete({ code });
    if (!item) return res.status(404).json({ error: 'Company not found' });
    await deleteCompanyLogoFiles(code);
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

router.delete('/:id', requireAuth, async (req, res, next) => {
  try {
    const CompanyModel = companyModelForRequest(req);
    const item = await CompanyModel.findByIdAndDelete(req.params.id);
    if (!item) return res.status(404).json({ error: 'Company not found' });
    await deleteCompanyLogoFiles(item.code);
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

export default router;
