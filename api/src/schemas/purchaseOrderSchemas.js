import mongoose from 'mongoose';
import { purchaseTotalsSchema } from './purchaseLineSchemas.js';

const purchaseOrderLineFields = {
  sr: { type: Number, default: 1 },
  productRetailCode: { type: String, trim: true, default: '' },
  itemDescription: { type: String, trim: true, default: '' },
  qty: { type: String, default: '0' },
  rate: { type: String, default: '0' },
  salesRate: { type: String, default: '0' },
  discPercent: { type: String, default: '0' },
  discValue: { type: String, default: '0' },
  taxType: { type: String, default: 'GST' },
  taxPercent: { type: String, default: '0' },
  amount: { type: String, default: '0' },
  receivedQty: { type: String, default: '0' }
};

export const purchaseOrderLineSchema = new mongoose.Schema(purchaseOrderLineFields, { _id: false });

export const purchaseOrderHeaderFields = {
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
    enum: [
      'draft', 'open', 'confirmed', 'dispatched', 'posted', 'paid', 'received', 'closed', 'cancelled',
      'partially_received', 'fully_received'
    ],
    default: 'open'
  },
  lines: { type: [purchaseOrderLineSchema], default: [] },
  totals: { type: purchaseTotalsSchema, default: () => ({}) }
};
