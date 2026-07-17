import mongoose from 'mongoose';
import { salesTotalsSchema } from './salesLineSchemas.js';

const deliveryChallanLineFields = {
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
  soPrefix: { type: String, trim: true, uppercase: true, default: '' },
    soDocNo: { type: Number, default: null },
    soFormattedDocNo: { type: String, trim: true, default: '' },
    soLineSr: { type: Number, default: null },
    soOrderedQty: { type: String, default: '0' },
    soPendingQty: { type: String, default: '0' },
    invoicedQty: { type: String, default: '0' }
};

export const deliveryChallanLineSchema = new mongoose.Schema(deliveryChallanLineFields, { _id: false });

export const salesOrderReferenceSchema = new mongoose.Schema(
  {
    soPrefix: { type: String, trim: true, uppercase: true, default: 'SO' },
    docNo: { type: Number, required: true },
    formattedDocNo: { type: String, trim: true, default: '' }
  },
  { _id: false }
);

export const deliveryChallanHeaderFields = {
  docPrefix: { type: String, required: true, trim: true, uppercase: true },
  docNo: { type: Number, required: true },
  formattedDocNo: { type: String, required: true, unique: true, trim: true },
  billDate: { type: String, trim: true, default: '' },
  salesMan: { type: String, trim: true, default: '' },
  customer: { type: String, trim: true, default: '' },
  customerDetails: { type: String, trim: true, default: '' },
  narration: { type: String, trim: true, default: '' },
  status: {
    type: String,
    enum: [
      'draft', 'open', 'confirmed', 'dispatched', 'posted', 'paid', 'shipped', 'closed', 'cancelled',
      'partially_invoiced', 'fully_invoiced'
    ],
    default: 'open'
  },
  lines: { type: [deliveryChallanLineSchema], default: [] },
  totals: { type: salesTotalsSchema, default: () => ({}) },
  soReference: { type: String, trim: true, default: '' },
  soReferences: { type: [salesOrderReferenceSchema], default: [] }
};
