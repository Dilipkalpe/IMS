import bcrypt from 'bcrypt';
import { EditDeleteAuthLog } from '../models/EditDeleteAuthLog.js';
import { SecuritySettings } from '../models/SecuritySettings.js';

const SETTINGS_KEY = 'global';
const BCRYPT_ROUNDS = 12;

function defaultPlainPassword() {
  return process.env.IMS_EDIT_DELETE_PASSWORD || 'Ims@Edit2024';
}

export async function ensureEditDeletePasswordSettings() {
  let doc = await SecuritySettings.findOne({ key: SETTINGS_KEY }).select('+editDeletePasswordHash');
  if (!doc) {
    const hash = await bcrypt.hash(defaultPlainPassword(), BCRYPT_ROUNDS);
    doc = await SecuritySettings.create({
      key: SETTINGS_KEY,
      editDeletePasswordHash: hash,
      editDeleteConfirmationRequired: true,
      updatedBy: 'system'
    });
    console.log('Security settings initialized with default edit/delete confirmation password.');
    return doc;
  }
  if (!doc.editDeletePasswordHash) {
    doc.editDeletePasswordHash = await bcrypt.hash(defaultPlainPassword(), BCRYPT_ROUNDS);
    doc.updatedBy = 'system';
    await doc.save();
    console.log('Edit/delete confirmation password was missing — default applied.');
  }
  return doc;
}

export async function isEditDeleteConfirmationRequired() {
  await ensureEditDeletePasswordSettings();
  const doc = await SecuritySettings.findOne({ key: SETTINGS_KEY });
  return doc?.editDeleteConfirmationRequired !== false;
}

export async function getEditDeleteConfirmationPolicy() {
  const required = await isEditDeleteConfirmationRequired();
  return { confirmationRequired: required };
}

export async function getEditDeletePasswordStatus() {
  const doc = await SecuritySettings.findOne({ key: SETTINGS_KEY }).select('+editDeletePasswordHash');
  return {
    configured: Boolean(doc?.editDeletePasswordHash),
    confirmationRequired: doc?.editDeleteConfirmationRequired !== false,
    updatedAt: doc?.updatedAt ?? null,
    updatedBy: doc?.updatedBy ?? ''
  };
}

export async function updateEditDeleteSecuritySettings({ newPassword, confirmationRequired }, adminUser) {
  const update = {
    updatedBy: adminUser?.username || adminUser?.fullName || 'administrator',
    updatedByUserId: adminUser?.id ? String(adminUser.id) : ''
  };

  if (confirmationRequired !== undefined) {
    update.editDeleteConfirmationRequired = Boolean(confirmationRequired);
  }

  if (newPassword !== undefined) {
    const password = String(newPassword ?? '').trim();
    if (password.length < 6) {
      throw new Error('Confirmation password must be at least 6 characters.');
    }
    update.editDeletePasswordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);
  }

  if (newPassword === undefined && confirmationRequired === undefined) {
    throw new Error('Provide newPassword and/or confirmationRequired.');
  }

  const doc = await SecuritySettings.findOneAndUpdate(
    { key: SETTINGS_KEY },
    update,
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  return {
    configured: Boolean(doc.editDeletePasswordHash),
    confirmationRequired: doc.editDeleteConfirmationRequired !== false,
    updatedAt: doc.updatedAt,
    updatedBy: doc.updatedBy
  };
}

export async function updateEditDeletePassword(newPassword, adminUser) {
  return updateEditDeleteSecuritySettings({ newPassword }, adminUser);
}

export async function verifyEditDeletePassword(password) {
  const doc = await SecuritySettings.findOne({ key: SETTINGS_KEY }).select('+editDeletePasswordHash');
  if (!doc?.editDeletePasswordHash) {
    await ensureEditDeletePasswordSettings();
    const refreshed = await SecuritySettings.findOne({ key: SETTINGS_KEY }).select('+editDeletePasswordHash');
    if (!refreshed?.editDeletePasswordHash) return false;
    return bcrypt.compare(String(password ?? ''), refreshed.editDeletePasswordHash);
  }
  return bcrypt.compare(String(password ?? ''), doc.editDeletePasswordHash);
}

export async function logEditDeleteAuthAttempt({
  action,
  module,
  recordKey,
  success,
  user,
  req
}) {
  try {
    await EditDeleteAuthLog.create({
      action,
      module: String(module ?? '').trim(),
      recordKey: String(recordKey ?? '').trim(),
      success: Boolean(success),
      username: user?.username || '',
      userId: user?.id ? String(user.id) : '',
      role: user?.role || '',
      ipAddress: req?.ip || req?.socket?.remoteAddress || '',
      userAgent: String(req?.headers?.['user-agent'] ?? '').slice(0, 512)
    });
  } catch (err) {
    console.warn('Failed to write edit/delete auth log:', err.message);
  }
}
