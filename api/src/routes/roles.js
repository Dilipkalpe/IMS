import { Router } from 'express';
import { requireAuth } from '../middleware/requireAuth.js';
import { requireAdmin } from '../middleware/requireAdmin.js';
import * as roleService from '../services/roleService.js';
import * as menuPermService from '../services/menuPermissionService.js';

const router = Router();

router.use(requireAuth, requireAdmin);

router.get('/', async (_req, res, next) => {
  try {
    const items = await roleService.listRoles();
    res.json({ items });
  } catch (err) {
    next(err);
  }
});

router.get('/active-names', async (_req, res, next) => {
  try {
    const items = await roleService.listActiveRoleNames();
    res.json({ items });
  } catch (err) {
    next(err);
  }
});

router.get('/:id', async (req, res, next) => {
  try {
    const item = await roleService.getRoleById(req.params.id);
    res.json(item);
  } catch (err) {
    next(err);
  }
});

router.post('/', async (req, res, next) => {
  try {
    const actor = req.authUser?.username || req.authUser?.fullName || null;
    const item = await roleService.createRole(req.body, actor);
    res.status(201).json(item);
  } catch (err) {
    next(err);
  }
});

router.put('/:id', async (req, res, next) => {
  try {
    const actor = req.authUser?.username || req.authUser?.fullName || null;
    const item = await roleService.updateRole(req.params.id, req.body, actor);
    res.json(item);
  } catch (err) {
    next(err);
  }
});

router.patch('/:id/active', async (req, res, next) => {
  try {
    const actor = req.authUser?.username || req.authUser?.fullName || null;
    const isActive = req.body?.isActive !== false;
    const item = await roleService.setRoleActive(req.params.id, isActive, actor);
    res.json(item);
  } catch (err) {
    next(err);
  }
});

router.delete('/:id', async (req, res, next) => {
  try {
    const actor = req.authUser?.username || req.authUser?.fullName || null;
    const result = await roleService.deleteRole(req.params.id, actor);
    res.json(result);
  } catch (err) {
    next(err);
  }
});

router.get('/:roleId/permissions', async (req, res, next) => {
  try {
    const data = await menuPermService.getPermissionsForRole(req.params.roleId);
    res.json(data);
  } catch (err) {
    next(err);
  }
});

router.post('/:roleId/permissions', async (req, res, next) => {
  try {
    const permissions = req.body?.permissions ?? req.body;
    const data = await menuPermService.savePermissionsForRole(req.params.roleId, permissions);
    res.json(data);
  } catch (err) {
    next(err);
  }
});

export default router;
