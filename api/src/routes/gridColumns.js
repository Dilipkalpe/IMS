import { Router } from 'express';
import { requireAuth } from '../middleware/requireAuth.js';
import { requireAdmin } from '../middleware/requireAdmin.js';
import { isTransactionLineGridModule } from '../catalog/salesLineGridColumns.js';
import {
  getGridColumnPreferences,
  listSupportedModules,
  resetGlobalGridColumnDefaults,
  resetUserGridColumnPreferences,
  saveGlobalGridColumnDefaults,
  saveUserGridColumnPreferences
} from '../services/gridColumnPreferences.js';

const router = Router();

router.get('/modules', requireAuth, async (_req, res, next) => {
  try {
    res.json(listSupportedModules());
  } catch (err) {
    next(err);
  }
});

router.get('/:moduleKey', requireAuth, async (req, res, next) => {
  try {
    const moduleKey = String(req.params.moduleKey ?? '').trim();
    if (!isTransactionLineGridModule(moduleKey)) {
      return res.status(400).json({ error: 'Invalid module key.' });
    }
    const prefs = await getGridColumnPreferences(req.authUser.id, moduleKey);
    res.json(prefs);
  } catch (err) {
    next(err);
  }
});

router.put('/:moduleKey', requireAuth, async (req, res, next) => {
  try {
    const moduleKey = String(req.params.moduleKey ?? '').trim();
    if (!isTransactionLineGridModule(moduleKey)) {
      return res.status(400).json({ error: 'Invalid module key.' });
    }
    const { visibleColumnKeys } = req.body ?? {};
    if (!Array.isArray(visibleColumnKeys)) {
      return res.status(400).json({ error: 'visibleColumnKeys must be an array.' });
    }
    const prefs = await saveUserGridColumnPreferences(
      req.authUser.id,
      moduleKey,
      visibleColumnKeys
    );
    res.json(prefs);
  } catch (err) {
    next(err);
  }
});

router.post('/:moduleKey/reset', requireAuth, async (req, res, next) => {
  try {
    const moduleKey = String(req.params.moduleKey ?? '').trim();
    if (!isTransactionLineGridModule(moduleKey)) {
      return res.status(400).json({ error: 'Invalid module key.' });
    }
    const prefs = await resetUserGridColumnPreferences(req.authUser.id, moduleKey);
    res.json(prefs);
  } catch (err) {
    next(err);
  }
});

router.put('/:moduleKey/global-default', requireAuth, requireAdmin, async (req, res, next) => {
  try {
    const moduleKey = String(req.params.moduleKey ?? '').trim();
    if (!isTransactionLineGridModule(moduleKey)) {
      return res.status(400).json({ error: 'Invalid module key.' });
    }
    const { visibleColumnKeys } = req.body ?? {};
    if (!Array.isArray(visibleColumnKeys)) {
      return res.status(400).json({ error: 'visibleColumnKeys must be an array.' });
    }
    const result = await saveGlobalGridColumnDefaults(
      moduleKey,
      visibleColumnKeys,
      req.authUser
    );
    res.json({ success: true, ...result });
  } catch (err) {
    next(err);
  }
});

router.post('/:moduleKey/global-default/reset', requireAuth, requireAdmin, async (req, res, next) => {
  try {
    const moduleKey = String(req.params.moduleKey ?? '').trim();
    if (!isTransactionLineGridModule(moduleKey)) {
      return res.status(400).json({ error: 'Invalid module key.' });
    }
    const result = await resetGlobalGridColumnDefaults(moduleKey);
    res.json({ success: true, ...result });
  } catch (err) {
    next(err);
  }
});

export default router;
