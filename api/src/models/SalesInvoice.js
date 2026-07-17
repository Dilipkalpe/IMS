import mongoose from 'mongoose';
import { salesInvoiceHeaderFields } from '../schemas/salesInvoiceSchemas.js';

const salesInvoiceSchema = new mongoose.Schema(
  {
    ...salesInvoiceHeaderFields,
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
    ewayBillNo: { type: String, trim: true, default: '' },
    ewayBillDate: { type: Date },
    vehicleNo: { type: String, trim: true, default: '' },
    transporter: { type: String, trim: true, default: '' },
    transporterId: { type: String, trim: true, default: '' },
    distanceKm: { type: Number, default: 0 },
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

salesInvoiceSchema.index({ docPrefix: 1, docNo: 1 }, { unique: true });
salesInvoiceSchema.index({ invoiceDate: -1, docNo: -1 });
salesInvoiceSchema.index({
  customer: 'text',
  salesMan: 'text',
  narration: 'text',
  formattedDocNo: 'text',
  dcReference: 'text',
  gstin: 'text'
});

export const SalesInvoice = mongoose.model('SalesInvoice', salesInvoiceSchema);
