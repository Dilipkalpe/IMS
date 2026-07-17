import mongoose from 'mongoose';
import { basePurchaseHeaderFields } from '../schemas/purchaseLineSchemas.js';

const purchaseReturnSchema = new mongoose.Schema(
  {
    ...basePurchaseHeaderFields,
    returnDate: { type: Date, default: () => new Date() },
    invoiceReference: { type: String, trim: true, default: '' },
    returnReason: { type: String, trim: true, default: '' },
    qcRemark: { type: String, trim: true, default: '' },
    returnWarehouse: { type: String, trim: true, default: '' }
  },
  { timestamps: true }
);

purchaseReturnSchema.index({ docPrefix: 1, docNo: 1 }, { unique: true });
purchaseReturnSchema.index({ supplier: 'text', invoiceReference: 'text', formattedDocNo: 'text' });

export const PurchaseReturn = mongoose.model('PurchaseReturn', purchaseReturnSchema);
