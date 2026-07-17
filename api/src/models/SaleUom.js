import mongoose from 'mongoose';

const saleUomSchema = new mongoose.Schema(
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
    symbol: {
      type: String,
      trim: true,
      default: ''
    },
    decimals: {
      type: Number,
      default: 0,
      min: 0,
      max: 6
    },
    activeStatus: {
      type: Boolean,
      default: true
    }
  },
  { timestamps: true }
);

saleUomSchema.index({ name: 'text', code: 'text', symbol: 'text' });

export const SaleUom = mongoose.model('SaleUom', saleUomSchema);
