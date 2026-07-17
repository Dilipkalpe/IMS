import mongoose from 'mongoose';

const labelFormatSchema = new mongoose.Schema(
  {
    formatCode: { type: String, required: true, trim: true, uppercase: true },
    labelName: { type: String, required: true, trim: true, maxlength: 120 },
    labelType: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      enum: ['product', 'barcode', 'qr', 'batch', 'warehouse', 'shipping']
    },
    widthMm: { type: Number, required: true },
    heightMm: { type: Number, required: true },
    printerType: { type: String, trim: true, lowercase: true, default: 'any' },
    layoutJson: { type: mongoose.Schema.Types.Mixed, required: true },
    schemaVersion: { type: Number, default: 2 },
    isDefault: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true },
    updatedBy: { type: String, trim: true, default: '' }
  },
  { timestamps: true, collection: 'label_formats' }
);

labelFormatSchema.index({ formatCode: 1 }, { unique: true });
labelFormatSchema.index({ labelType: 1, isDefault: 1 });

export const LabelFormat = mongoose.model('LabelFormat', labelFormatSchema);
