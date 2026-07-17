import mongoose from 'mongoose';

const lineSchema = new mongoose.Schema(
  {
    sr: Number,
    productRetailCode: String,
    itemDescription: String,
    qty: String,
    rate: String,
    discPercent: String,
    discValue: String,
    taxType: String,
    taxPercent: String,
    amount: String
  },
  { _id: false }
);

const totalsSchema = new mongoose.Schema(
  {
    totQty: String,
    gross: String,
    discount: String,
    spDiscount: String,
    addOther: String,
    net: String,
    saleAmount: String,
    orderAmount: String,
    customerReturn: String,
    receivableToCustomer: String,
    supplierReturn: String,
    payableToSupplier: String
  },
  { _id: false }
);

const transactionDocumentSchema = new mongoose.Schema(
  {
    docType: {
      type: String,
      required: true,
      enum: [
        'sales_order',
        'delivery_challan',
        'sales_invoice',
        'sales_return',
        'purchase_order',
        'grn',
        'purchase_invoice',
        'purchase_return'
      ]
    },
    docNo: { type: Number, required: true },
    formattedDocNo: { type: String, required: true },
    billDate: String,
    salesMan: String,
    customer: String,
    buyer: String,
    supplier: String,
    customerDetails: String,
    supplierDetails: String,
    narration: String,
    status: { type: String, default: 'open' },
    lines: [lineSchema],
    totals: totalsSchema
  },
  { timestamps: true }
);

transactionDocumentSchema.index({ docType: 1, docNo: -1 });
transactionDocumentSchema.index({ docType: 1, formattedDocNo: 1 }, { unique: true });

export const TransactionDocument = mongoose.model('TransactionDocument', transactionDocumentSchema);
