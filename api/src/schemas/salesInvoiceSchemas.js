import mongoose from 'mongoose';
import { salesTotalsSchema } from './salesLineSchemas.js';
import { numberedDocReferenceSchema } from './documentReferenceSchemas.js';

const salesInvoiceLineFields = {
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
  dcPrefix: { type: String, trim: true, uppercase: true, default: '' },
  dcDocNo: { type: Number, default: null },
  dcFormattedDocNo: { type: String, trim: true, default: '' },
  dcLineSr: { type: Number, default: null },
  dcDeliveredQty: { type: String, default: '0' },
  dcPendingQty: { type: String, default: '0' }
};

export const salesInvoiceLineSchema = new mongoose.Schema(salesInvoiceLineFields, { _id: false });

export const deliveryChallanReferenceSchema = numberedDocReferenceSchema('DC');

export const salesInvoiceHeaderFields = {
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
    enum: ['draft', 'open', 'confirmed', 'dispatched', 'posted', 'paid', 'shipped', 'closed', 'cancelled'],
    default: 'open'
  },
  lines: { type: [salesInvoiceLineSchema], default: [] },
  totals: { type: salesTotalsSchema, default: () => ({}) },
  dcReference: { type: String, trim: true, default: '' },
  dcReferences: { type: [deliveryChallanReferenceSchema], default: [] }
};
