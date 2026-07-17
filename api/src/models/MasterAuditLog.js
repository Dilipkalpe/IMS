import mongoose from 'mongoose';

const masterAuditLogSchema = new mongoose.Schema(
  {
    entityType: { type: String, required: true, trim: true },
    entityKey: { type: String, required: true, trim: true },
    action: { type: String, required: true, trim: true },
    changes: { type: mongoose.Schema.Types.Mixed },
    actor: { type: String, default: 'system', trim: true },
    timestamp: { type: Date, default: () => new Date() },
  },
  { collection: 'masterauditlogs' },
);

masterAuditLogSchema.index({ entityType: 1, entityKey: 1, timestamp: -1 });

export const MasterAuditLog = mongoose.model('MasterAuditLog', masterAuditLogSchema);
