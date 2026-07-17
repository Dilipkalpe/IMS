import mongoose from 'mongoose';

const openingStockEntrySchema = new mongoose.Schema(
  {
    productCode: { type: String, required: true, trim: true, uppercase: true },
    productName: { type: String, default: '', trim: true },
    unit: { type: String, default: 'EA', trim: true },
    quantity: { type: Number, required: true, default: 0 },
    rate: { type: Number, required: true, default: 0 },
    value: { type: Number, required: true, default: 0 },
    openingDate: { type: Date, required: true },
    sourceFinancialYear: { type: String, default: '', trim: true },
    targetFinancialYear: { type: String, default: '', trim: true },
    note: { type: String, default: 'Carry-forward opening stock', trim: true }
  },
  { timestamps: true }
);

openingStockEntrySchema.index({ productCode: 1, openingDate: 1 });

export const OpeningStockEntry = mongoose.model('OpeningStockEntry', openingStockEntrySchema);

