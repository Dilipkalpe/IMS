import mongoose from 'mongoose';

const receiptVoucherSchema = new mongoose.Schema(
  {
    voucherType: {
      type: String,
      default: 'receipt',
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
    cashBank: {
      type: String,
      trim: true,
      default: 'CASH'
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
    narration: {
      type: String,
      trim: true,
      default: ''
    },
    status: {
      type: String,
      enum: ['Draft', 'Posted', 'Cancelled'],
      default: 'Posted'
    },
    sourceDocType: {
      type: String,
      default: ''
    },
    sourcePayrollRunNo: { type: Number, default: 0 },
    sourceDocId: { type: String, trim: true, default: '' },
    sourceFormattedDocNo: { type: String, trim: true, default: '' }
  },
  { timestamps: true }
);

receiptVoucherSchema.index({ accountName: 'text', accountCode: 'text', narration: 'text' });

export const ReceiptVoucher = mongoose.model('ReceiptVoucher', receiptVoucherSchema);
