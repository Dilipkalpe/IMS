import { Router } from 'express';
import { requireAuth } from '../middleware/requireAuth.js';
import { requireAdmin } from '../middleware/requireAdmin.js';
import {
  getEditDeleteConfirmationPolicy,
  getEditDeletePasswordStatus,
  isEditDeleteConfirmationRequired,
  logEditDeleteAuthAttempt,
  updateEditDeleteSecuritySettings,
  verifyEditDeletePassword
} from '../services/editDeletePassword.js';
import { getUserFromToken } from '../services/auth.js';

const router = Router();

async function resolveOptionalUser(req) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7).trim() : '';
  if (!token) return null;
  const user = await getUserFromToken(token);
  if (!user) return null;
  return {
    id: String(user._id),
    username: user.username,
    fullName: user.fullName,
    role: user.role
  };
}

router.get('/edit-delete-password/policy', async (_req, res, next) => {
  try {
    const policy = await getEditDeleteConfirmationPolicy();
    res.json(policy);
  } catch (err) {
    next(err);
  }
});

router.get('/edit-delete-password/status', requireAuth, requireAdmin, async (_req, res, next) => {
  try {
    const status = await getEditDeletePasswordStatus();
    res.json(status);
  } catch (err) {
    next(err);
  }
});

router.put('/edit-delete-password', requireAuth, requireAdmin, async (req, res, next) => {
  try {
    const { newPassword, confirmationRequired } = req.body ?? {};
    const result = await updateEditDeleteSecuritySettings(
      { newPassword, confirmationRequired },
      req.authUser
    );
    res.json({
      success: true,
      message: 'Edit/delete security settings updated.',
      ...result
    });
  } catch (err) {
    if (
      String(err.message || '').includes('at least 6')
      || String(err.message || '').includes('Provide newPassword')
    ) {
      return res.status(400).json({ error: err.message });
    }
    next(err);
  }
});

router.post('/edit-delete-password/verify', async (req, res, next) => {
  try {
    const { password, action, module, recordKey } = req.body ?? {};
    const normalizedAction = String(action ?? '').trim().toLowerCase();
    if (normalizedAction !== 'edit' && normalizedAction !== 'delete') {
      return res.status(400).json({ error: 'action must be edit or delete.' });
    }

    const user = await resolveOptionalUser(req);
    const confirmationRequired = await isEditDeleteConfirmationRequired();

    if (!confirmationRequired) {
      return res.json({ authorized: true, confirmationRequired: false });
    }

    const ok = await verifyEditDeletePassword(password);

    await logEditDeleteAuthAttempt({
      action: normalizedAction,
      module,
      recordKey,
      success: ok,
      user,
      req
    });

    if (!ok) {
      return res.status(403).json({ error: 'Incorrect confirmation password.', authorized: false });
    }

    res.json({ authorized: true });
  } catch (err) {
    next(err);
  }
});

export default router;
