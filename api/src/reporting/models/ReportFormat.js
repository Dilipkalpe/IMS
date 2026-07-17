import mongoose from 'mongoose';

const reportFormatSchema = new mongoose.Schema(
  {
    formatCode: { type: String, required: true, trim: true, uppercase: true },
    formatName: { type: String, required: true, trim: true, maxlength: 120 },
    transactionType: { type: String, required: true, trim: true, lowercase: true, index: true },
    paperSizeKey: { type: String, required: true, trim: true, default: 'A4_PORTRAIT' },
    orientation: { type: String, trim: true, lowercase: true, default: 'portrait' },
    customPaper: {
      widthMm: { type: Number },
      heightMm: { type: Number },
      marginsMm: {
        top: { type: Number, default: 10 },
        right: { type: Number, default: 10 },
        bottom: { type: Number, default: 10 },
        left: { type: Number, default: 10 }
      }
    },
    isDefault: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true },
    isSystem: { type: Boolean, default: false },
    layoutJson: { type: mongoose.Schema.Types.Mixed, required: true },
    schemaVersion: { type: Number, default: 2 },
    printSettings: {
      autoPrintAfterSave: { type: Boolean, default: false },
      printPreview: { type: Boolean, default: true },
      numberOfCopies: { type: Number, default: 1 },
      watermark: { type: String, default: 'original' }
    },
    visibilityOptions: { type: mongoose.Schema.Types.Mixed, default: () => ({}) },
    updatedBy: { type: String, trim: true, default: '' }
  },
  { timestamps: true, collection: 'report_formats' }
);

reportFormatSchema.index({ formatCode: 1 }, { unique: true });
reportFormatSchema.index({ transactionType: 1, isDefault: 1 });
reportFormatSchema.index({ transactionType: 1, isActive: 1 });

export const ReportFormat = mongoose.model('ReportFormat', reportFormatSchema);
