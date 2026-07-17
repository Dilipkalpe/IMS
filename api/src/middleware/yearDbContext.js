import { AsyncLocalStorage } from 'node:async_hooks';
import { getActiveYearDbName, getMongoUri, parseDbNameFromUri } from '../config/db.js';
import { verifyToken } from '../services/auth.js';

export const yearDbStorage = new AsyncLocalStorage();

export function getContextYearDbName() {
  const store = yearDbStorage.getStore();
  if (store?.yearDb) return store.yearDb;
  return getActiveYearDbName() || parseDbNameFromUri(getMongoUri());
}

function resolveYearDbFromRequest(req) {
  const fromReq = String(req?.financialYearDb ?? '').trim();
  if (fromReq) return fromReq;

  const header = req?.headers?.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7).trim() : '';
  if (!token) return '';

  const payload = verifyToken(token);
  return String(payload?.yearDb ?? '').trim();
}

/** Binds each HTTP request to its financial-year database (from JWT or requireAuth). */
export function yearDbContextMiddleware(req, res, next) {
  const yearDb = resolveYearDbFromRequest(req);
  if (!yearDb) return next();
  yearDbStorage.run({ yearDb }, () => next());
}
