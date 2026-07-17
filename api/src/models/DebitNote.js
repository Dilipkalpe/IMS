import mongoose from 'mongoose';

const debitNoteSchema = new mongoose.Schema(
  {
    voucherType: {
      type: String,
      default: 'debit_note',
      trim: true
    },
    voucherNo: {
      type: Number,
      required: true,
      unique: true
    },
    refNo: {
      type: String,
      trim: true,
      default: ''
    },
    voucherDate: {
      type: Date,
      default: () => new Date()
    },
    accountCode: {
      type: String,
      trim: true,
      uppercase: true,
      default: ''
    },
    accountName: {
      type: String,
      trim: true,
      default: ''
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
      default: 0
    },
    gstRate: {
      type: Number,
      default: 0,
      min: 0,
      max: 100
    },
    totalAmount: {
      type: Number,
      required: true,
      min: 0,
      default: 0
    },
    isIgst: {
      type: Boolean,
      default: false
    },
    narration: {
      type: String,
      trim: true,
      default: ''
    },
    status: {
      type: String,
      enum: ['Draft', 'Posted', 'Cancelled'],
      default: 'Posted'
    }
  },
  { timestamps: true }
);

debitNoteSchema.index({ accountName: 'text', accountCode: 'text', narration: 'text' });

export const DebitNote = mongoose.model('DebitNote', debitNoteSchema);
