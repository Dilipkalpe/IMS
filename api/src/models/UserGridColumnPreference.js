import mongoose from 'mongoose';

const userGridColumnPreferenceSchema = new mongoose.Schema(
  {
    userId: { type: String, required: true, trim: true, index: true },
    moduleKey: { type: String, required: true, trim: true, index: true },
    visibleColumnKeys: { type: [String], default: [] }
  },
  { timestamps: true }
);

userGridColumnPreferenceSchema.index({ userId: 1, moduleKey: 1 }, { unique: true });

export const UserGridColumnPreference = mongoose.model(
  'UserGridColumnPreference',
  userGridColumnPreferenceSchema
);
