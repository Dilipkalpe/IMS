import mongoose from 'mongoose';

const systemSettingsSchema = new mongoose.Schema(
  {
    key: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true
    },
    salesRateSource: {
      type: String,
      enum: ['product_master', 'purchase_invoice'],
      default: 'product_master'
    }
  },
  { timestamps: true }
);

export const SystemSettings = mongoose.model('SystemSettings', systemSettingsSchema);

export const SALES_PURCHASE_SETTINGS_KEY = 'sales_purchase';
