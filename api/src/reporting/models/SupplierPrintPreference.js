import mongoose from 'mongoose';

const schema = new mongoose.Schema(
  {
    supplierCode: { type: String, required: true, trim: true, uppercase: true },
    transactionType: { type: String, required: true, trim: true, lowercase: true },
    reportFormatId: { type: mongoose.Schema.Types.ObjectId, ref: 'ReportFormat', required: true },
    isActive: { type: Boolean, default: true }
  },
  { timestamps: true, collection: 'supplier_print_preferences' }
);

schema.index({ supplierCode: 1, transactionType: 1 }, { unique: true });

export const SupplierPrintPreference = mongoose.model('SupplierPrintPreference', schema);
