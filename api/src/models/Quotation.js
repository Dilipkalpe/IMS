import mongoose from 'mongoose';

const quotationLineSchema = new mongoose.Schema(
  {
    sr: { type: Number, default: 1 },
    productRetailCode: { type: String, trim: true, default: '' },
    itemDescription: { type: String, trim: true, default: '' },
    qty: { type: String, default: '0' },
    rate: { type: String, default: '0' },
    discPercent: { type: String, default: '0' },
    discValue: { type: String, default: '0' },
    taxType: { type: String, default: 'GST' },
    taxPercent: { type: String, default: '0' },
    amount: { type: String, default: '0' }
  },
  { _id: false }
);

const quotationTotalsSchema = new mongoose.Schema(
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

const quotationSchema = new mongoose.Schema(
  {
    qtPrefix: {
      type: String,
      trim: true,
      uppercase: true,
      default: 'QT'
    },
    docNo: {
      type: Number,
      required: true
    },
    formattedDocNo: {
      type: String,
      required: true,
      unique: true,
      trim: true
    },
    quoteDate: {
      type: Date,
      default: () => new Date()
    },
    billDate: {
      type: String,
      trim: true,
      default: ''
    },
    salesMan: {
      type: String,
      trim: true,
      default: ''
    },
    customer: {
      type: String,
      trim: true,
      default: ''
    },
    customerDetails: {
      type: String,
      trim: true,
      default: ''
    },
    paymentTerms: {
      type: String,
      trim: true,
      default: ''
    },
    validUntil: {
      type: String,
      trim: true,
      default: ''
    },
    billingAddress: {
      type: String,
      trim: true,
      default: ''
    },
    shippingAddress: {
      type: String,
      trim: true,
      default: ''
    },
    placeOfSupply: {
      type: String,
      trim: true,
      default: ''
    },
    narration: {
      type: String,
      trim: true,
      default: ''
    },
    status: {
      type: String,
      enum: ['draft', 'open', 'sent', 'accepted', 'expired', 'cancelled'],
      default: 'open'
    },
    lines: {
      type: [quotationLineSchema],
      default: []
    },
    totals: {
      type: quotationTotalsSchema,
      default: () => ({})
    },
    orderAmount: {
      type: Number,
      default: 0
    }
  },
  { timestamps: true }
);

quotationSchema.index({ qtPrefix: 1, docNo: 1 }, { unique: true });
quotationSchema.index({
  customer: 'text',
  salesMan: 'text',
  narration: 'text',
  formattedDocNo: 'text',
  qtPrefix: 'text'
});

export const Quotation = mongoose.model('Quotation', quotationSchema);
