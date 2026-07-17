import mongoose from 'mongoose';
import { baseSalesHeaderFields } from '../schemas/salesLineSchemas.js';

const salesReturnSchema = new mongoose.Schema(
  {
    ...baseSalesHeaderFields,
    returnDate: { type: Date, default: () => new Date() },
    invoiceReference: { type: String, trim: true, default: '' },
    returnReason: { type: String, trim: true, default: '' },
    qcRemark: { type: String, trim: true, default: '' },
    returnWarehouse: { type: String, trim: true, default: '' }
  },
  { timestamps: true }
);

salesReturnSchema.index({ docPrefix: 1, docNo: 1 }, { unique: true });
salesReturnSchema.index({
  customer: 'text',
  salesMan: 'text',
  narration: 'text',
  formattedDocNo: 'text',
  invoiceReference: 'text',
  returnReason: 'text'
});

export const SalesReturn = mongoose.model('SalesReturn', salesReturnSchema);
