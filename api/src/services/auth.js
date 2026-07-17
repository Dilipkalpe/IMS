import crypto from 'crypto';
import { AppUser } from '../models/AppUser.js';
import { Company } from '../models/Company.js';
import { resolveUserPermissions } from './menuPermissionService.js';

const SALT_LEN = 16;
const KEY_LEN = 64;
const ITERATIONS = 100_000;
const DIGEST = 'sha512';
const TOKEN_TTL_MS = 8 * 60 * 60 * 1000;

function getSecret() {
  return process.env.IMS_AUTH_SECRET || 'ims-dev-auth-secret-change-in-production';
}

export function hashPassword(password) {
  const salt = crypto.randomBytes(SALT_LEN);
  const hash = crypto.pbkdf2Sync(password, salt, ITERATIONS, KEY_LEN, DIGEST);
  return `${ITERATIONS}:${salt.toString('base64')}:${hash.toString('base64')}`;
}

export function verifyPassword(password, stored) {
  if (!stored || typeof stored !== 'string') return false;
  const parts = stored.split(':');
  if (parts.length !== 3) return false;
  const [iterStr, saltB64, hashB64] = parts;
  const iterations = Number(iterStr);
  if (!Number.isFinite(iterations) || iterations < 1) return false;
  try {
    const salt = Buffer.from(saltB64, 'base64');
    const expected = Buffer.from(hashB64, 'base64');
    const actual = crypto.pbkdf2Sync(password, salt, iterations, expected.length, DIGEST);
    return crypto.timingSafeEqual(actual, expected);
  } catch {
    return false;
  }
}

function signToken(payload) {
  const body = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const sig = crypto.createHmac('sha256', getSecret()).update(body).digest('base64url');
  return `${body}.${sig}`;
}

export function verifyToken(token) {
  if (!token || typeof token !== 'string') return null;
  const [body, sig] = token.split('.');
  if (!body || !sig) return null;
  const expected = crypto.createHmac('sha256', getSecret()).update(body).digest('base64url');
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;
  try {
    const payload = JSON.parse(Buffer.from(body, 'base64url').toString('utf8'));
    if (!payload?.exp || Date.now() > payload.exp) return null;
    return payload;
  } catch {
    return null;
  }
}

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export async function authenticateUser(loginId, password, extraClaims = {}) {
  const id = String(loginId ?? '').trim();
  if (!id || !password) {
    return { ok: false, status: 400, error: 'Employee ID / email and password are required.' };
  }

  const exact = new RegExp(`^${escapeRegex(id)}$`, 'i');
  const user = await AppUser.findOne({
    $or: [
      { username: exact },
      { email: exact },
      { employeeId: exact }
    ]
  }).select('+passwordHash');

  if (!user) {
    return { ok: false, status: 401, error: 'Invalid credentials. Check your login ID and password.' };
  }

  if (!user.activeStatus) {
    return { ok: false, status: 403, error: 'This account is inactive. Contact your administrator.' };
  }

  if (!user.passwordHash || !verifyPassword(password, user.passwordHash)) {
    return { ok: false, status: 401, error: 'Invalid credentials. Check your login ID and password.' };
  }

  const company =
    (await Company.findOne({ isDefault: true, activeStatus: true })) ??
    (await Company.findOne({ activeStatus: true }).sort({ createdAt: 1 }));

  const exp = Date.now() + TOKEN_TTL_MS;
  const token = signToken({
    sub: String(user._id),
    username: user.username,
    role: user.role,
    exp,
    ...(extraClaims && typeof extraClaims === 'object' ? extraClaims : {})
  });

  const permissions = await resolveUserPermissions(user);

  return {
    ok: true,
    token,
    expiresAt: new Date(exp).toISOString(),
    user: {
      id: String(user._id),
      username: user.username,
      employeeId: user.employeeId || user.username,
      fullName: user.fullName,
      role: user.role,
      roleId: user.roleId ? String(user.roleId) : null,
      department: user.department || '',
      email: user.email || '',
      canPrintBarcodeLabels:
        user.canPrintBarcodeLabels === true ||
        String(user.role).toLowerCase() === 'administrator'
    },
    permissions,
    company: company
      ? {
          code: company.code,
          businessName: company.businessName,
          tagline: company.tagline || 'Inventory & Billing ERP'
        }
      : {
          code: 'IMS',
          businessName: 'Inventory Management System',
          tagline: 'Inventory & Billing ERP'
        }
  };
}

export async function getUserFromToken(token) {
  const payload = verifyToken(token);
  if (!payload?.sub) return null;
  const user = await AppUser.findById(payload.sub).select('-passwordHash');
  if (!user || !user.activeStatus) return null;
  return user;
}

export async function getAuthContextFromToken(token) {
  const payload = verifyToken(token);
  if (!payload?.sub) return null;
  const user = await AppUser.findById(payload.sub).select('-passwordHash');
  if (!user || !user.activeStatus) return null;
  return { user, payload };
}
