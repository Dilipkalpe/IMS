import mongoose from 'mongoose';

const openingBalanceEntrySchema = new mongoose.Schema(
  {
    accountCode: { type: String, required: true, trim: true },
    accountName: { type: String, default: '', trim: true },
    amount: { type: Number, required: true, default: 0 },
    balanceType: { type: String, enum: ['Dr', 'Cr'], required: true, default: 'Dr' },
    openingDate: { type: Date, required: true },
    sourceFinancialYear: { type: String, default: '', trim: true },
    targetFinancialYear: { type: String, default: '', trim: true },
    note: { type: String, default: 'Carry-forward opening balance', trim: true }
  },
  { timestamps: true }
);

openingBalanceEntrySchema.index({ accountCode: 1, openingDate: 1 });

export const OpeningBalanceEntry = mongoose.model('OpeningBalanceEntry', openingBalanceEntrySchema);

