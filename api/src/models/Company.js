import mongoose from 'mongoose';

const companySchema = new mongoose.Schema(
  {
    code: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      uppercase: true
    },
    businessName: {
      type: String,
      required: true,
      trim: true
    },
    address: {
      type: String,
      trim: true,
      default: ''
    },
    phone: {
      type: String,
      trim: true,
      default: ''
    },
    email: {
      type: String,
      trim: true,
      default: ''
    },
    gstin: {
      type: String,
      trim: true,
      default: ''
    },
    state: {
      type: String,
      trim: true,
      default: ''
    },
    placeOfSupply: {
      type: String,
      trim: true,
      default: ''
    },
    bankName: {
      type: String,
      trim: true,
      default: ''
    },
    bankAccountNo: {
      type: String,
      trim: true,
      default: ''
    },
    bankIfsc: {
      type: String,
      trim: true,
      default: ''
    },
    bankAccountHolder: {
      type: String,
      trim: true,
      default: ''
    },
    logoText: {
      type: String,
      trim: true,
      default: ''
    },
    /** Public API path or legacy inline data URI (migrated to disk on read). */
    logoImage: {
      type: String,
      default: ''
    },
    terms: {
      type: [String],
      default: []
    },
    isDefault: {
      type: Boolean,
      default: false
    },
    activeStatus: {
      type: Boolean,
      default: true
    }
  },
  { timestamps: true }
);

companySchema.index({ businessName: 'text', code: 'text', gstin: 'text' });
companySchema.index({ isDefault: 1 });

export const Company = mongoose.model('Company', companySchema);
