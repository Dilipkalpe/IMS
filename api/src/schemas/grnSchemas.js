import mongoose from 'mongoose';
import { purchaseTotalsSchema } from './purchaseLineSchemas.js';
import { numberedDocReferenceSchema } from './documentReferenceSchemas.js';

const grnLineFields = {
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
  poPrefix: { type: String, trim: true, uppercase: true, default: '' },
  poDocNo: { type: Number, default: null },
  poFormattedDocNo: { type: String, trim: true, default: '' },
  poLineSr: { type: Number, default: null },
  poOrderedQty: { type: String, default: '0' },
  poPendingQty: { type: String, default: '0' },
  invoicedQty: { type: String, default: '0' }
};

export const grnLineSchema = new mongoose.Schema(grnLineFields, { _id: false });

export const purchaseOrderReferenceSchema = numberedDocReferenceSchema('PO');

export const grnHeaderFields = {
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
      'partially_invoiced', 'fully_invoiced'
    ],
    default: 'open'
  },
  lines: { type: [grnLineSchema], default: [] },
  totals: { type: purchaseTotalsSchema, default: () => ({}) },
  poReference: { type: String, trim: true, default: '' },
  poReferences: { type: [purchaseOrderReferenceSchema], default: [] }
};
