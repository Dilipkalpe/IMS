import mongoose from 'mongoose';

const schema = new mongoose.Schema(
  {
    customerCode: { type: String, required: true, trim: true, uppercase: true },
    transactionType: { type: String, required: true, trim: true, lowercase: true },
    reportFormatId: { type: mongoose.Schema.Types.ObjectId, ref: 'ReportFormat', required: true },
    isActive: { type: Boolean, default: true }
  },
  { timestamps: true, collection: 'customer_print_preferences' }
);

schema.index({ customerCode: 1, transactionType: 1 }, { unique: true });

export const CustomerPrintPreference = mongoose.model('CustomerPrintPreference', schema);
