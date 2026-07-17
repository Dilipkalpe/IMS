import { SoftwareLicense } from '../models/SoftwareLicense.js';

const SETTINGS_KEY = 'global';

export const LICENSE_TYPES = ['trial', 'permanent'];
export const LICENSE_PLAN_OPTIONS = [15, 30, 45];
export const DEFAULT_LICENSE_PLAN_DAYS = 30;
export const EXPIRING_SOON_THRESHOLD_DAYS = 7;

function addDays(date, days) {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

function startOfDay(date) {
  const value = new Date(date);
  value.setHours(0, 0, 0, 0);
  return value;
}

function daysRemainingFrom(now, expiresAt) {
  const diffMs = startOfDay(expiresAt).getTime() - startOfDay(now).getTime();
  return Math.ceil(diffMs / (24 * 60 * 60 * 1000));
}

export function isAdministratorRole(role) {
  return /^administrator$/i.test(String(role ?? '').trim());
}

function isPermanentLicense(doc) {
  return String(doc?.licenseType ?? 'trial').toLowerCase() === 'permanent';
}

function normalizeLicenseType(licenseType) {
  const value = String(licenseType ?? 'trial').trim().toLowerCase();
  if (!LICENSE_TYPES.includes(value)) {
    throw new Error('licenseType must be trial or permanent.');
  }
  return value;
}

function normalizeTrialDays(planDays) {
  const value = Number(planDays);
  if (!Number.isFinite(value) || value < 1) {
    throw new Error('Valid days must be at least 1 for a trial license.');
  }
  return Math.floor(value);
}

function buildStatusMessage({ licenseType, isExpired, isExpiringSoon, daysRemaining, expiresAt }) {
  if (licenseType === 'permanent') {
    return 'Permanent license — no expiry.';
  }
  if (isExpired) {
    return `Trial license expired on ${expiresAt.toISOString().slice(0, 10)}. Contact your administrator to extend.`;
  }
  if (isExpiringSoon) {
    return `Trial license expires in ${daysRemaining} day(s) on ${expiresAt.toISOString().slice(0, 10)}.`;
  }
  return `Trial license is active until ${expiresAt.toISOString().slice(0, 10)} (${daysRemaining} day(s) remaining).`;
}

export function serializeLicenseStatus(doc) {
  const licenseType = isPermanentLicense(doc) ? 'permanent' : 'trial';
  const activatedAt = new Date(doc.activatedAt);
  const now = new Date();

  if (licenseType === 'permanent') {
    return {
      licenseType,
      isPermanent: true,
      isActive: true,
      isExpired: false,
      isExpiringSoon: false,
      planDays: doc.planDays ?? null,
      activatedAt: activatedAt.toISOString(),
      expiresAt: null,
      daysRemaining: null,
      totalExtensionDays: doc.totalExtensionDays ?? 0,
      planOptions: LICENSE_PLAN_OPTIONS,
      licenseTypeOptions: LICENSE_TYPES,
      expiringSoonThresholdDays: EXPIRING_SOON_THRESHOLD_DAYS,
      message: buildStatusMessage({ licenseType }),
      updatedAt: doc.updatedAt ? new Date(doc.updatedAt).toISOString() : null,
      updatedBy: doc.updatedBy ?? ''
    };
  }

  const expiresAt = new Date(doc.expiresAt);
  const daysRemaining = daysRemainingFrom(now, expiresAt);
  const isExpired = !doc.expiresAt || expiresAt.getTime() <= now.getTime();
  const isActive = !isExpired;
  const isExpiringSoon = isActive && daysRemaining <= EXPIRING_SOON_THRESHOLD_DAYS;

  return {
    licenseType,
    isPermanent: false,
    isActive,
    isExpired,
    isExpiringSoon,
    planDays: doc.planDays,
    activatedAt: activatedAt.toISOString(),
    expiresAt: expiresAt.toISOString(),
    daysRemaining: Math.max(0, daysRemaining),
    totalExtensionDays: doc.totalExtensionDays ?? 0,
    planOptions: LICENSE_PLAN_OPTIONS,
    licenseTypeOptions: LICENSE_TYPES,
    expiringSoonThresholdDays: EXPIRING_SOON_THRESHOLD_DAYS,
    message: buildStatusMessage({ licenseType, isExpired, isExpiringSoon, daysRemaining, expiresAt }),
    updatedAt: doc.updatedAt ? new Date(doc.updatedAt).toISOString() : null,
    updatedBy: doc.updatedBy ?? ''
  };
}

async function migrateLegacyLicense(doc) {
  let changed = false;

  if (!doc.licenseType) {
    doc.licenseType = 'trial';
    changed = true;
  }

  if (doc.licenseType === 'trial' && !doc.expiresAt) {
    const planDays = normalizeTrialDays(doc.planDays || DEFAULT_LICENSE_PLAN_DAYS);
    doc.planDays = planDays;
    doc.expiresAt = addDays(doc.activatedAt || new Date(), planDays);
    changed = true;
  }

  if (doc.licenseType === 'permanent') {
    if (doc.expiresAt) {
      doc.expiresAt = null;
      changed = true;
    }
  }

  if (changed) {
    await doc.save();
  }

  return doc;
}

export async function ensureSoftwareLicense() {
  let doc = await SoftwareLicense.findOne({ key: SETTINGS_KEY });
  if (!doc) {
    const now = new Date();
    const envPlan = Number(process.env.IMS_LICENSE_PLAN_DAYS);
    const planDays = Number.isFinite(envPlan) && envPlan >= 1
      ? Math.floor(envPlan)
      : DEFAULT_LICENSE_PLAN_DAYS;
    const envType = String(process.env.IMS_LICENSE_TYPE ?? 'trial').trim().toLowerCase();
    const licenseType = LICENSE_TYPES.includes(envType) ? envType : 'trial';

    doc = await SoftwareLicense.create({
      key: SETTINGS_KEY,
      licenseType,
      planDays,
      activatedAt: now,
      expiresAt: licenseType === 'permanent' ? null : addDays(now, planDays),
      totalExtensionDays: 0,
      extensions: [],
      updatedBy: 'system'
    });

    const summary = licenseType === 'permanent'
      ? 'permanent license (no expiry)'
      : `${planDays}-day trial (expires ${doc.expiresAt.toISOString().slice(0, 10)})`;
    console.log(`Software license initialized: ${summary}.`);
    return doc;
  }

  return migrateLegacyLicense(doc);
}

export async function getLicenseStatus() {
  const doc = await ensureSoftwareLicense();
  return serializeLicenseStatus(doc);
}

export async function setLicense({ licenseType, planDays }, adminUser) {
  const normalizedType = normalizeLicenseType(licenseType);
  const now = new Date();
  const doc = await ensureSoftwareLicense();

  doc.licenseType = normalizedType;
  doc.activatedAt = now;

  if (normalizedType === 'permanent') {
    doc.expiresAt = null;
    doc.updatedBy = adminUser?.username || adminUser?.fullName || 'administrator';
    doc.updatedByUserId = adminUser?.id ? String(adminUser.id) : '';
    await doc.save();
    return serializeLicenseStatus(doc);
  }

  const normalizedPlanDays = normalizeTrialDays(planDays);
  doc.planDays = normalizedPlanDays;
  doc.expiresAt = addDays(now, normalizedPlanDays);
  doc.updatedBy = adminUser?.username || adminUser?.fullName || 'administrator';
  doc.updatedByUserId = adminUser?.id ? String(adminUser.id) : '';
  await doc.save();

  return serializeLicenseStatus(doc);
}

export async function renewLicense(planDays, adminUser) {
  return setLicense({ licenseType: 'trial', planDays }, adminUser);
}

export async function extendLicense(additionalDays, adminUser, note = '') {
  const days = Number(additionalDays);
  if (!Number.isFinite(days) || days < 1) {
    throw new Error('Extension days must be at least 1.');
  }

  const now = new Date();
  const doc = await ensureSoftwareLicense();
  if (isPermanentLicense(doc)) {
    throw new Error('Permanent licenses cannot be extended. Switch to a trial license first.');
  }

  const currentExpiry = doc.expiresAt ? new Date(doc.expiresAt) : now;
  const baseDate = currentExpiry.getTime() > now.getTime() ? currentExpiry : now;

  doc.licenseType = 'trial';
  doc.expiresAt = addDays(baseDate, days);
  doc.totalExtensionDays = (doc.totalExtensionDays ?? 0) + days;
  doc.extensions = doc.extensions ?? [];
  doc.extensions.push({
    days,
    extendedAt: now,
    extendedBy: adminUser?.username || adminUser?.fullName || 'administrator',
    note: String(note ?? '').trim()
  });
  doc.updatedBy = adminUser?.username || adminUser?.fullName || 'administrator';
  doc.updatedByUserId = adminUser?.id ? String(adminUser.id) : '';
  await doc.save();

  return serializeLicenseStatus(doc);
}

export async function getLicenseAdminDetails() {
  const doc = await ensureSoftwareLicense();
  const status = serializeLicenseStatus(doc);
  const extensions = (doc.extensions ?? [])
    .slice()
    .reverse()
    .map((entry) => ({
      days: entry.days,
      extendedAt: entry.extendedAt ? new Date(entry.extendedAt).toISOString() : null,
      extendedBy: entry.extendedBy ?? '',
      note: entry.note ?? ''
    }));

  return { ...status, extensions };
}
