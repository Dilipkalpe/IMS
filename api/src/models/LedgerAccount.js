import mongoose from 'mongoose';

const ledgerAccountSchema = new mongoose.Schema(
  {
    code: { type: String, required: true, unique: true, trim: true },
    name: { type: String, required: true, trim: true },
    kind: {
      type: String,
      enum: ['cash', 'bank', 'nominal', 'party'],
      default: 'cash'
    },
    openingBalance: { type: Number, default: 0 },
    openingBalanceType: {
      type: String,
      enum: ['Dr', 'Cr'],
      default: 'Dr'
    },
    activeStatus: { type: Boolean, default: true }
  },
  { timestamps: true }
);

ledgerAccountSchema.index({ name: 'text', code: 'text' });

export const LedgerAccount = mongoose.model('LedgerAccount', ledgerAccountSchema);
