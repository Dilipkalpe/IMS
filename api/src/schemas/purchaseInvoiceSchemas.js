import mongoose from 'mongoose';
import { purchaseTotalsSchema } from './purchaseLineSchemas.js';
import { numberedDocReferenceSchema } from './documentReferenceSchemas.js';

const purchaseInvoiceLineFields = {
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
  grnPrefix: { type: String, trim: true, uppercase: true, default: '' },
  grnDocNo: { type: Number, default: null },
  grnFormattedDocNo: { type: String, trim: true, default: '' },
  grnLineSr: { type: Number, default: null },
  grnReceivedQty: { type: String, default: '0' },
  grnPendingQty: { type: String, default: '0' }
};

export const purchaseInvoiceLineSchema = new mongoose.Schema(purchaseInvoiceLineFields, { _id: false });

export const grnReferenceSchema = numberedDocReferenceSchema('GRN');

export const purchaseInvoiceHeaderFields = {
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
  lines: { type: [purchaseInvoiceLineSchema], default: [] },
  totals: { type: purchaseTotalsSchema, default: () => ({}) },
  grnReference: { type: String, trim: true, default: '' },
  grnReferences: { type: [grnReferenceSchema], default: [] }
};
