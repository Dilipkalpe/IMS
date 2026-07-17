import { Router } from 'express';
import { requireAuth } from '../middleware/requireAuth.js';
import { requireAdmin } from '../middleware/requireAdmin.js';
import * as menuPermService from '../services/menuPermissionService.js';

const router = Router();

router.get('/', requireAuth, requireAdmin, async (_req, res, next) => {
  try {
    const menus = await menuPermService.getMenuTree();
    res.json({ menus });
  } catch (err) {
    next(err);
  }
});

export default router;
