import { Router } from 'express';
import { requireAuth } from '../middleware/requireAuth.js';
import { requireAdmin } from '../middleware/requireAdmin.js';
import {
  createSalesBillTemplate,
  deleteSalesBillTemplate,
  duplicateSalesBillTemplate,
  ensureDefaultSalesBillTemplates,
  getDefaultSalesBillTemplate,
  getSalesBillTemplateById,
  getSalesBillTemplateByKey,
  listSalesBillTemplates,
  updateSalesBillTemplate,
  updateSalesBillTemplateLayout
} from '../services/salesBillTemplates.js';

const router = Router();

router.get('/', requireAuth, async (_req, res, next) => {
  try {
    res.json(await listSalesBillTemplates());
  } catch (err) {
    next(err);
  }
});

router.get('/default', requireAuth, async (req, res, next) => {
  try {
    const docTypeKey = String(req.query.docTypeKey ?? 'sales_invoice').trim();
    const template = await getDefaultSalesBillTemplate(docTypeKey);
    if (!template) {
      return res.status(404).json({ error: 'No default template found. Run ensure-defaults.' });
    }
    res.json(template);
  } catch (err) {
    next(err);
  }
});

router.get('/by-key/:templateKey', requireAuth, async (req, res, next) => {
  try {
    const template = await getSalesBillTemplateByKey(req.params.templateKey);
    if (!template) return res.status(404).json({ error: 'Template not found.' });
    res.json(template);
  } catch (err) {
    next(err);
  }
});

router.get('/:id', requireAuth, async (req, res, next) => {
  try {
    const template = await getSalesBillTemplateById(req.params.id);
    if (!template) return res.status(404).json({ error: 'Template not found.' });
    res.json(template);
  } catch (err) {
    next(err);
  }
});

router.post('/', requireAuth, requireAdmin, async (req, res, next) => {
  try {
    const template = await createSalesBillTemplate(req.body ?? {}, req.authUser?.username ?? '');
    res.status(201).json(template);
  } catch (err) {
    next(err);
  }
});

router.post('/ensure-defaults', requireAuth, requireAdmin, async (_req, res, next) => {
  try {
    const result = await ensureDefaultSalesBillTemplates();
    res.json(result);
  } catch (err) {
    next(err);
  }
});

router.post('/:id/duplicate', requireAuth, requireAdmin, async (req, res, next) => {
  try {
    const { templateKey, name } = req.body ?? {};
    const template = await duplicateSalesBillTemplate(
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
    const template = await updateSalesBillTemplate(
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
    const template = await updateSalesBillTemplateLayout(
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
    res.json(await deleteSalesBillTemplate(req.params.id));
  } catch (err) {
    next(err);
  }
});

export default router;
