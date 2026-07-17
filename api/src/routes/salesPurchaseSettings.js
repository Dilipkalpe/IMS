import { Router } from 'express';
import { requireAuth } from '../middleware/requireAuth.js';
import { requireAdmin } from '../middleware/requireAdmin.js';
import {
  getSalesPurchaseSettings,
  updateSalesPurchaseSettings
} from '../services/salesPurchaseSettings.js';

const router = Router();

router.get('/', requireAuth, async (_req, res, next) => {
  try {
    const settings = await getSalesPurchaseSettings();
    res.json(settings);
  } catch (err) {
    next(err);
  }
});

router.put('/', requireAuth, requireAdmin, async (req, res, next) => {
  try {
    const settings = await updateSalesPurchaseSettings(req.body ?? {});
    res.json(settings);
  } catch (err) {
    next(err);
  }
});

export default router;
