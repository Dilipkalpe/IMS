import mongoose from 'mongoose';
import { purchaseOrderHeaderFields } from '../schemas/purchaseOrderSchemas.js';

const purchaseOrderSchema = new mongoose.Schema(
  {
    ...purchaseOrderHeaderFields,
    poDate: { type: Date, default: () => new Date() },
    paymentTerms: { type: String, trim: true, default: '' },
    deliveryPriority: { type: String, trim: true, default: 'Normal' },
    billingAddress: { type: String, trim: true, default: '' },
    shipToAddress: { type: String, trim: true, default: '' }
  },
  { timestamps: true }
);

purchaseOrderSchema.index({ docPrefix: 1, docNo: 1 }, { unique: true });
purchaseOrderSchema.index({ supplier: 'text', buyer: 'text', narration: 'text', formattedDocNo: 'text' });

export const PurchaseOrder = mongoose.model('PurchaseOrder', purchaseOrderSchema);
