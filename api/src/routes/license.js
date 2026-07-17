import { Router } from 'express';
import { requireAuth } from '../middleware/requireAuth.js';
import { requireAdmin } from '../middleware/requireAdmin.js';
import {
  extendLicense,
  getLicenseAdminDetails,
  getLicenseStatus,
  setLicense
} from '../services/softwareLicense.js';

const router = Router();

router.get('/status', async (_req, res, next) => {
  try {
    const status = await getLicenseStatus();
    res.json(status);
  } catch (err) {
    next(err);
  }
});

router.get('/admin', requireAuth, requireAdmin, async (_req, res, next) => {
  try {
    const details = await getLicenseAdminDetails();
    res.json(details);
  } catch (err) {
    next(err);
  }
});

router.post('/renew', requireAuth, requireAdmin, async (req, res, next) => {
  try {
    const { licenseType, planDays } = req.body ?? {};
    const status = await setLicense({ licenseType, planDays }, req.authUser);
    const message = status.licenseType === 'permanent'
      ? 'Permanent license applied.'
      : `Trial license applied for ${status.planDays} day(s).`;
    res.json({
      success: true,
      message,
      ...status
    });
  } catch (err) {
    const msg = String(err.message || '');
    if (
      msg.includes('licenseType must be')
      || msg.includes('Valid days must be')
    ) {
      return res.status(400).json({ error: err.message });
    }
    next(err);
  }
});

router.post('/extend', requireAuth, requireAdmin, async (req, res, next) => {
  try {
    const { days, note } = req.body ?? {};
    const status = await extendLicense(days, req.authUser, note);
    res.json({
      success: true,
      message: `License extended by ${Number(days)} day(s).`,
      ...status
    });
  } catch (err) {
    if (String(err.message || '').includes('Extension days')
      || String(err.message || '').includes('Permanent licenses')) {
      return res.status(400).json({ error: err.message });
    }
    next(err);
  }
});

export default router;
