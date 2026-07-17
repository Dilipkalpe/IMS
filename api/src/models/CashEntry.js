import mongoose from 'mongoose';

const cashEntryLineSchema = new mongoose.Schema(
  {
    srNo: { type: Number, default: 1 },
    particular: { type: String, trim: true, default: '' },
    amount: { type: Number, required: true, min: 0, default: 0 }
  },
  { _id: false }
);

const cashEntrySchema = new mongoose.Schema(
  {
    entryType: {
      type: String,
      default: 'cash_entry',
      trim: true
    },
    entryNo: {
      type: Number,
      required: true,
      unique: true
    },
    entryDate: {
      type: Date,
      default: () => new Date()
    },
    lines: {
      type: [cashEntryLineSchema],
      default: []
    },
    totalAmount: {
      type: Number,
      required: true,
      min: 0,
      default: 0
    },
    status: {
      type: String,
      enum: ['Draft', 'Posted', 'Cancelled'],
      default: 'Posted'
    }
  },
  { timestamps: true }
);

cashEntrySchema.index({ 'lines.particular': 'text' });

export const CashEntry = mongoose.model('CashEntry', cashEntrySchema);
