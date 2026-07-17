import mongoose from 'mongoose';

export const salesLineSchema = new mongoose.Schema(
  {
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
    amount: { type: String, default: '0' }
  },
  { _id: false }
);

export const salesTotalsSchema = new mongoose.Schema(
  {
    totQty: { type: String, default: '0' },
    gross: { type: String, default: '0' },
    discount: { type: String, default: '0' },
    spDiscount: { type: String, default: '0' },
    addOther: { type: String, default: '0' },
    net: { type: String, default: '0' },
    saleAmount: { type: String, default: '0' },
    orderAmount: { type: String, default: '0' },
    customerReturn: { type: String, default: '0' },
    receivableToCustomer: { type: String, default: '0' }
  },
  { _id: false }
);

export const baseSalesHeaderFields = {
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
  lines: { type: [salesLineSchema], default: [] },
  totals: { type: salesTotalsSchema, default: () => ({}) }
};
