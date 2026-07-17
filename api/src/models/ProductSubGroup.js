import mongoose from 'mongoose';

const productSubGroupSchema = new mongoose.Schema(
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
    mainGroup: {
      type: String,
      default: 'General',
      trim: true
    },
    activeStatus: {
      type: Boolean,
      default: true
    }
  },
  { timestamps: true }
);

productSubGroupSchema.index({ name: 'text', code: 'text', mainGroup: 'text' });

export const ProductSubGroup = mongoose.model('ProductSubGroup', productSubGroupSchema);

