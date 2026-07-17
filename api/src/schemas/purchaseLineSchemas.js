import mongoose from 'mongoose';
import { salesLineSchema } from './salesLineSchemas.js';

export const purchaseTotalsSchema = new mongoose.Schema(
  {
    totQty: { type: String, default: '0' },
    gross: { type: String, default: '0' },
    discount: { type: String, default: '0' },
    spDiscount: { type: String, default: '0' },
    addOther: { type: String, default: '0' },
    net: { type: String, default: '0' },
    orderAmount: { type: String, default: '0' },
    saleAmount: { type: String, default: '0' },
    supplierReturn: { type: String, default: '0' },
    payableToSupplier: { type: String, default: '0' }
  },
  { _id: false }
);

export const basePurchaseHeaderFields = {
  docPrefix: { type: String, required: true, trim: true, uppercase: true },
  docNo: { type: Number, required: true },
  formattedDocNo: { type: String, required: true, unique: true, trim: true },
  billDate: { type: String, trim: true, default: '' },
  buyer: { type: String, trim: true, default: '' },
  supplier: { type: String, trim: true, default: '' },
  supplierDetails: { type: String, trim: true, default: '' },
  narration: { type: String, trim: true, default: '' },
  status: {
    type: String,
    enum: ['draft', 'open', 'confirmed', 'dispatched', 'posted', 'paid', 'received', 'closed', 'cancelled'],
    default: 'open'
  },
  lines: { type: [salesLineSchema], default: [] },
  totals: { type: purchaseTotalsSchema, default: () => ({}) }
};
