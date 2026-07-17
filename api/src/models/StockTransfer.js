import mongoose from 'mongoose';

const stockTransferLineSchema = new mongoose.Schema(
  {
    srNo: Number,
    productId: String,
    productCode: String,
    brandName: String,
    productName: String,
    hsnCode: String,
    batchNo: String,
    expDate: String,
    qty: String,
    unit: String
  },
  { _id: false }
);

const stockTransferSchema = new mongoose.Schema(
  {
    entryNo: { type: String, required: true },
    fromGodown: String,
    toGodown: String,
    transferDate: Date,
    remark: String,
    lines: [stockTransferLineSchema],
    status: { type: String, default: 'posted' }
  },
  { timestamps: true }
);

export const StockTransfer = mongoose.model('StockTransfer', stockTransferSchema);
