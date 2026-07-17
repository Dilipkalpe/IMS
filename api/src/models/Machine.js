import mongoose from 'mongoose';

const machineSchema = new mongoose.Schema(
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
    description: {
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

machineSchema.index({ name: 'text', code: 'text' });

export const Machine = mongoose.model('Machine', machineSchema);
