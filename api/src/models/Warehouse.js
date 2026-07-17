import mongoose from 'mongoose';

const warehouseSchema = new mongoose.Schema(
  {
    code: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      uppercase: true
    },
    name: {
      type: String,
      required: true,
      trim: true
    },
    location: {
      type: String,
      trim: true
    },
    activeStatus: {
      type: Boolean,
      default: true
    }
  },
  { timestamps: true }
);

warehouseSchema.index({ name: 'text', code: 'text' });

export const Warehouse = mongoose.model('Warehouse', warehouseSchema);
