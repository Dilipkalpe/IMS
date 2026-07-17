import mongoose from 'mongoose';

const salesOrderLineSchema = new mongoose.Schema(
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
    amount: { type: String, default: '0' },
    deliveredQty: { type: String, default: '0' }
  },
  { _id: false }
);

const salesOrderTotalsSchema = new mongoose.Schema(
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

const salesOrderSchema = new mongoose.Schema(
  {
    soPrefix: {
      type: String,
      trim: true,
      uppercase: true,
      default: 'SO'
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
    soDate: {
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
    deliveryPriority: {
      type: String,
      trim: true,
      default: 'Normal'
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
    narration: {
      type: String,
      trim: true,
      default: ''
    },
    status: {
      type: String,
      enum: [
        'draft',
        'open',
        'partially_delivered',
        'fully_delivered',
        'confirmed',
        'picking',
        'shipped',
        'closed',
        'cancelled'
      ],
      default: 'open'
    },
    lines: {
      type: [salesOrderLineSchema],
      default: []
    },
    totals: {
      type: salesOrderTotalsSchema,
      default: () => ({})
    }
  },
  { timestamps: true }
);

salesOrderSchema.index({ soPrefix: 1, docNo: 1 }, { unique: true });
salesOrderSchema.index({ customer: 'text', salesMan: 'text', narration: 'text', formattedDocNo: 'text', soPrefix: 'text' });

export const SalesOrder = mongoose.model('SalesOrder', salesOrderSchema);
