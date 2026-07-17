import mongoose from 'mongoose';
import { getConfigConnection } from '../config/db.js';

const financialYearAuditLogSchema = new mongoose.Schema(
  {
    action: { type: String, required: true, trim: true },
    financialYearId: { type: mongoose.Schema.Types.ObjectId, ref: 'FinancialYear', required: true },
    previousYearId: { type: mongoose.Schema.Types.ObjectId, ref: 'FinancialYear', default: null },
    databaseName: { type: String, required: true, trim: true },
    performedBy: { type: String, default: null },
    details: { type: Object, default: {} },
    timestamp: { type: Date, default: () => new Date() }
  },
  { collection: 'FinancialYearAuditLog' }
);

financialYearAuditLogSchema.index({ financialYearId: 1, timestamp: -1 });

const conn = getConfigConnection();
export const FinancialYearAuditLog = conn.model('FinancialYearAuditLog', financialYearAuditLogSchema);

