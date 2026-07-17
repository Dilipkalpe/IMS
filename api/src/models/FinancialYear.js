import mongoose from 'mongoose';
import { getConfigConnection } from '../config/db.js';

const financialYearSchema = new mongoose.Schema(
  {
    financialYearName: { type: String, required: true, trim: true },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    databaseName: { type: String, required: true, trim: true },
    isActive: { type: Boolean, default: true },
    closed: { type: Boolean, default: false },
    previousYearId: { type: mongoose.Schema.Types.ObjectId, ref: 'FinancialYear', default: null },
    createdDate: { type: Date, default: () => new Date() },
    createdBy: { type: String, default: null }
  },
  { collection: 'FinancialYear' }
);

financialYearSchema.index({ financialYearName: 1 }, { unique: true });
financialYearSchema.index({ databaseName: 1 }, { unique: true });
financialYearSchema.index({ startDate: 1, endDate: 1 }, { unique: true });

const conn = getConfigConnection();
export const FinancialYear = conn.model('FinancialYear', financialYearSchema);

