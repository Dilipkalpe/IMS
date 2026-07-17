import mongoose from 'mongoose';

const gridColumnGlobalDefaultSchema = new mongoose.Schema(
  {
    moduleKey: { type: String, required: true, unique: true, trim: true },
    visibleColumnKeys: { type: [String], default: [] },
    updatedBy: { type: String, trim: true, default: '' },
    updatedByUserId: { type: String, trim: true, default: '' }
  },
  { timestamps: true }
);

export const GridColumnGlobalDefault = mongoose.model(
  'GridColumnGlobalDefault',
  gridColumnGlobalDefaultSchema
);
