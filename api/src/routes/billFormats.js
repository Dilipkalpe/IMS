import { Router } from 'express';
import { requireAuth } from '../middleware/requireAuth.js';
import { requireAdmin } from '../middleware/requireAdmin.js';
import { getCatalogPayload } from '../catalog/billFormatCatalog.js';
import {
  createBillFormat,
  deleteBillFormat,
  duplicateBillFormat,
  ensureDefaultBillFormats,
  exportBillFormatJson,
  getBillFormatById,
  getBillFormatByKey,
  getDefaultBillFormat,
  importBillFormatJson,
  listBillFormats,
  resolveBillFormat,
  updateBillFormat,
  updateBillFormatLayout
} from '../services/billFormatTemplates.js';

const router = Router();

router.get('/catalog', requireAuth, (_req, res) => {
  res.json(getCatalogPayload());
});

router.get('/resolve', requireAuth, async (req, res, next) => {
  try {
    const docTypeKey = String(req.query.docTypeKey ?? 'sales_invoice').trim();
    const partyCode = req.query.partyCode ? String(req.query.partyCode).trim() : null;
    const accountType = req.query.accountType ? String(req.query.accountType).trim() : null;
    res.json(await resolveBillFormat({ docTypeKey, partyCode, accountType }));
  } catch (err) {
    next(err);
  }
});

router.get('/', requireAuth, async (req, res, next) => {
  try {
    const transactionType = req.query.transactionType
      ? String(req.query.transactionType).trim()
      : undefined;
    const includeInactive = req.query.includeInactive === 'true';
    res.json(await listBillFormats({ transactionType, includeInactive }));
  } catch (err) {
    next(err);
  }
});

router.get('/default', requireAuth, async (req, res, next) => {
  try {
    const docTypeKey = String(req.query.docTypeKey ?? 'sales_invoice').trim();
    const template = await getDefaultBillFormat(docTypeKey);
    if (!template) {
      return res.status(404).json({ error: 'No default format found. Run ensure-defaults.' });
    }
    res.json(template);
  } catch (err) {
    next(err);
  }
});

router.get('/by-key/:templateKey', requireAuth, async (req, res, next) => {
  try {
    const template = await getBillFormatByKey(req.params.templateKey);
    if (!template) return res.status(404).json({ error: 'Format not found.' });
    res.json(template);
  } catch (err) {
    next(err);
  }
});

router.get('/:id/export', requireAuth, requireAdmin, async (req, res, next) => {
  try {
    res.json(await exportBillFormatJson(req.params.id));
  } catch (err) {
    next(err);
  }
});

router.get('/:id', requireAuth, async (req, res, next) => {
  try {
    const template = await getBillFormatById(req.params.id);
    if (!template) return res.status(404).json({ error: 'Format not found.' });
    res.json(template);
  } catch (err) {
    next(err);
  }
});

router.post('/', requireAuth, requireAdmin, async (req, res, next) => {
  try {
    const template = await createBillFormat(req.body ?? {}, req.authUser?.username ?? '');
    res.status(201).json(template);
  } catch (err) {
    next(err);
  }
});

router.post('/ensure-defaults', requireAuth, requireAdmin, async (_req, res, next) => {
  try {
    res.json(await ensureDefaultBillFormats());
  } catch (err) {
    next(err);
  }
});

router.post('/import', requireAuth, requireAdmin, async (req, res, next) => {
  try {
    const template = await importBillFormatJson(req.body ?? {}, req.authUser?.username ?? '');
    res.status(201).json(template);
  } catch (err) {
    next(err);
  }
});

router.post('/:id/duplicate', requireAuth, requireAdmin, async (req, res, next) => {
  try {
    const { templateKey, name } = req.body ?? {};
    const template = await duplicateBillFormat(
      req.params.id,
      templateKey,
      name,
      req.authUser?.username ?? ''
    );
    res.status(201).json(template);
  } catch (err) {
    next(err);
  }
});

router.put('/:id', requireAuth, requireAdmin, async (req, res, next) => {
  try {
    const template = await updateBillFormat(
      req.params.id,
      req.body ?? {},
      req.authUser?.username ?? ''
    );
    res.json(template);
  } catch (err) {
    next(err);
  }
});

router.put('/:id/layout', requireAuth, requireAdmin, async (req, res, next) => {
  try {
    const { layoutJson } = req.body ?? {};
    if (!layoutJson) {
      return res.status(400).json({ error: 'layoutJson is required.' });
    }
    const template = await updateBillFormatLayout(
      req.params.id,
      layoutJson,
      req.authUser?.username ?? ''
    );
    res.json(template);
  } catch (err) {
    next(err);
  }
});

router.delete('/:id', requireAuth, requireAdmin, async (req, res, next) => {
  try {
    res.json(await deleteBillFormat(req.params.id));
  } catch (err) {
    next(err);
  }
});

export default router;
