import mongoose from 'mongoose';
import { purchaseInvoiceHeaderFields } from '../schemas/purchaseInvoiceSchemas.js';

const purchaseInvoiceSchema = new mongoose.Schema(
  {
    ...purchaseInvoiceHeaderFields,
    invoiceDate: { type: Date, default: () => new Date() },
    dueDate: { type: Date },
    gstin: { type: String, trim: true, default: '' },
    placeOfSupply: { type: String, trim: true, default: '' },
    paymentType: {
      type: String,
      enum: ['credit', 'cash', 'partial'],
      default: 'credit'
    },
    paymentMode: {
      type: String,
      enum: ['', 'cash', 'bank', 'upi', 'cheque', 'card'],
      default: ''
    },
    billAmount: { type: Number, default: 0 },
    paidAmount: { type: Number, default: 0 },
    balanceDue: { type: Number, default: 0 },
    paymentLinks: {
      type: [
        {
          voucherType: { type: String, trim: true, default: '' },
          voucherNo: { type: Number, default: 0 },
          amount: { type: Number, default: 0 },
          voucherDate: { type: Date },
          refNo: { type: String, trim: true, default: '' }
        }
      ],
      default: []
    }
  },
  { timestamps: true }
);

purchaseInvoiceSchema.index({ docPrefix: 1, docNo: 1 }, { unique: true });
purchaseInvoiceSchema.index({ supplier: 'text', gstin: 'text', formattedDocNo: 'text' });

export const PurchaseInvoice = mongoose.model('PurchaseInvoice', purchaseInvoiceSchema);
