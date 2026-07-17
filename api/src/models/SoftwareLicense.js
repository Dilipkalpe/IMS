import mongoose from 'mongoose';
import { getConfigConnection } from '../config/db.js';

const extensionEntrySchema = new mongoose.Schema(
  {
    days: { type: Number, required: true, min: 1 },
    extendedAt: { type: Date, default: () => new Date() },
    extendedBy: { type: String, trim: true, default: '' },
    note: { type: String, trim: true, default: '' }
  },
  { _id: false }
);

const softwareLicenseSchema = new mongoose.Schema(
  {
    key: { type: String, required: true, unique: true, default: 'global' },
    licenseType: { type: String, enum: ['trial', 'permanent'], default: 'trial' },
    planDays: { type: Number, min: 1, default: 30 },
    activatedAt: { type: Date, required: true },
    expiresAt: { type: Date, default: null },
    totalExtensionDays: { type: Number, default: 0, min: 0 },
    extensions: { type: [extensionEntrySchema], default: [] },
    updatedBy: { type: String, trim: true, default: '' },
    updatedByUserId: { type: String, trim: true, default: '' }
  },
  { collection: 'SoftwareLicense', timestamps: true }
);

const conn = getConfigConnection();
export const SoftwareLicense = conn.model('SoftwareLicense', softwareLicenseSchema);
