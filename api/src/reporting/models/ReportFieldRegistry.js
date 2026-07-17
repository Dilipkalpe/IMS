import mongoose from 'mongoose';

const reportFieldRegistrySchema = new mongoose.Schema(
  {
    fieldKey: { type: String, required: true, trim: true, lowercase: true },
    transactionTypes: { type: [String], default: ['*'] },
    displayLabel: { type: String, required: true, trim: true },
    token: { type: String, required: true, trim: true },
    category: { type: String, trim: true, default: 'document' },
    dataPath: { type: String, trim: true, default: '' },
    controlTypes: { type: [String], default: ['text', 'dynamicText'] },
    sortOrder: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true }
  },
  { timestamps: true, collection: 'report_field_registry' }
);

reportFieldRegistrySchema.index({ fieldKey: 1 }, { unique: true });

export const ReportFieldRegistry = mongoose.model('ReportFieldRegistry', reportFieldRegistrySchema);
