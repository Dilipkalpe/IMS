import mongoose from 'mongoose';

const securitySettingsSchema = new mongoose.Schema(
  {
    key: { type: String, required: true, unique: true, default: 'global' },
    editDeletePasswordHash: { type: String, select: false, default: '' },
    editDeleteConfirmationRequired: { type: Boolean, default: true },
    updatedBy: { type: String, trim: true, default: '' },
    updatedByUserId: { type: String, trim: true, default: '' }
  },
  { timestamps: true }
);

export const SecuritySettings = mongoose.model('SecuritySettings', securitySettingsSchema);
