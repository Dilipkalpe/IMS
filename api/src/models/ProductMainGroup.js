import mongoose from 'mongoose';

const productMainGroupSchema = new mongoose.Schema(
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

productMainGroupSchema.index({ name: 'text', code: 'text' });

export const ProductMainGroup = mongoose.model('ProductMainGroup', productMainGroupSchema);

