import { MasterAuditLog } from '../models/MasterAuditLog.js';

/** Lightweight audit trail for master-data changes (products, accounts, templates). */
export async function logMasterAudit({ entityType, entityKey, action, changes, actor }) {
  const entry = {
    entityType: String(entityType ?? '').trim(),
    entityKey: String(entityKey ?? '').trim(),
    action: String(action ?? '').trim(),
    changes: changes ?? null,
    actor: actor ? String(actor).trim() : 'system',
    timestamp: new Date(),
  };

  try {
    await MasterAuditLog.create(entry);
  } catch (err) {
    console.warn('[master-audit] failed to persist:', err?.message ?? err);
  }
}
