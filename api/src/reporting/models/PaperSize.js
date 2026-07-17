import mongoose from 'mongoose';

const paperSizeSchema = new mongoose.Schema(
  {
    key: { type: String, required: true, trim: true, uppercase: true },
    name: { type: String, required: true, trim: true },
    widthMm: { type: Number, required: true },
    heightMm: { type: Number, required: true },
    marginsMm: {
      top: { type: Number, default: 10 },
      right: { type: Number, default: 10 },
      bottom: { type: Number, default: 10 },
      left: { type: Number, default: 10 }
    },
    orientation: { type: String, trim: true, lowercase: true, default: 'portrait' },
    isThermal: { type: Boolean, default: false },
    isSystem: { type: Boolean, default: true },
    isActive: { type: Boolean, default: true }
  },
  { timestamps: true, collection: 'paper_sizes' }
);

paperSizeSchema.index({ key: 1 }, { unique: true });

export const PaperSize = mongoose.model('PaperSize', paperSizeSchema);
