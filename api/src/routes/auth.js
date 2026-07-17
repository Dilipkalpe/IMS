import { Router } from 'express';
import { authenticateUser, getUserFromToken } from '../services/auth.js';
import { resolveUserPermissions } from '../services/menuPermissionService.js';
import { FinancialYear } from '../models/FinancialYear.js';
import { getYearConnection } from '../db/yearModels.js';
import { getLicenseStatus, isAdministratorRole } from '../services/softwareLicense.js';

const router = Router();

router.post('/login', async (req, res, next) => {
  try {
    const { loginId, password, financialYearId } = req.body ?? {};

    const fyId = String(financialYearId ?? '').trim();
    if (!fyId) {
      return res.status(400).json({ error: 'Financial year is required.' });
    }

    const fy = await FinancialYear.findById(fyId).lean();
    if (!fy || fy.isActive === false) {
      return res.status(400).json({ error: 'Invalid or inactive financial year.' });
    }

    const result = await authenticateUser(loginId, password, { yearDb: fy.databaseName });
    if (!result.ok) {
      return res.status(result.status).json({ error: result.error });
    }

    const license = await getLicenseStatus();
    if (license.isExpired && !isAdministratorRole(result.user?.role)) {
      return res.status(403).json({
        error: 'Software license has expired. Contact your administrator to extend the license.',
        code: 'LICENSE_EXPIRED',
        license
      });
    }

    // Verify the selected financial-year database is reachable (per-request context uses JWT yearDb).
    try {
      getYearConnection(fy.databaseName);
    } catch {
      return res.status(500).json({ error: 'Could not connect to the selected financial year database.' });
    }

    res.json({
      token: result.token,
      expiresAt: result.expiresAt,
      user: result.user,
      permissions: result.permissions ?? [],
      company: result.company,
      license,
      financialYear: {
        id: String(fy._id),
        financialYearName: fy.financialYearName,
        startDate: fy.startDate,
        endDate: fy.endDate,
        databaseName: fy.databaseName,
        isActive: fy.isActive !== false,
        closed: fy.closed === true
      }
    });
  } catch (err) {
    next(err);
  }
});

router.post('/logout', (_req, res) => {
  // JWT sessions are stateless; clients discard the token locally.
  res.status(204).end();
});

router.get('/me', async (req, res, next) => {
  try {
    const header = req.headers.authorization || '';
    const token = header.startsWith('Bearer ') ? header.slice(7).trim() : '';
    if (!token) {
      return res.status(401).json({ error: 'Authentication required.' });
    }
    const user = await getUserFromToken(token);
    if (!user) {
      return res.status(401).json({ error: 'Session expired or invalid.' });
    }
    const permissions = await resolveUserPermissions(user);
    res.json({
      user: {
        id: String(user._id),
        username: user.username,
        employeeId: user.employeeId || user.username,
        fullName: user.fullName,
        role: user.role,
        roleId: user.roleId ? String(user.roleId) : null,
        department: user.department || '',
        email: user.email || ''
      },
      permissions
    });
  } catch (err) {
    next(err);
  }
});

export default router;
