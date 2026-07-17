import { getAuthContextFromToken } from '../services/auth.js';
import { getLicenseStatus, isAdministratorRole } from '../services/softwareLicense.js';

export async function requireAuth(req, res, next) {
  try {
    const header = req.headers.authorization || '';
    const token = header.startsWith('Bearer ') ? header.slice(7).trim() : '';
    if (!token) {
      return res.status(401).json({ error: 'Authentication required.' });
    }
    const ctx = await getAuthContextFromToken(token);
    if (!ctx?.user) {
      return res.status(401).json({ error: 'Session expired or invalid.' });
    }
    const yearDb = String(ctx.payload?.yearDb ?? '').trim();
    if (!yearDb) {
      return res.status(401).json({ error: 'Financial year session is invalid. Please sign in again.' });
    }
    req.authUser = {
      id: String(ctx.user._id),
      username: ctx.user.username,
      fullName: ctx.user.fullName,
      role: ctx.user.role,
      email: ctx.user.email || ''
    };
    req.financialYearDb = yearDb;

    const license = await getLicenseStatus();
    if (license.isExpired && !isAdministratorRole(req.authUser.role)) {
      return res.status(403).json({
        error: 'Software license has expired. Contact your administrator to extend the license.',
        code: 'LICENSE_EXPIRED',
        license
      });
    }

    next();
  } catch (err) {
    next(err);
  }
}
