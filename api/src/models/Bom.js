import mongoose from 'mongoose';

const bomRawLineSchema = new mongoose.Schema(
  {
    srNo: Number,
    itemId: String,
    itemCode: String,
    itemName: String,
    unit: String,
    qty: { type: Number, default: 0 },
    scrapPercent: { type: Number, default: 0 },
    rate: { type: Number, default: 0 },
    amount: { type: Number, default: 0 }
  },
  { _id: false }
);

const bomConsumableLineSchema = new mongoose.Schema(
  {
    srNo: Number,
    material: String,
    qty: { type: Number, default: 0 },
    rate: { type: Number, default: 0 },
    amount: { type: Number, default: 0 }
  },
  { _id: false }
);

const bomSchema = new mongoose.Schema(
  {
    productId: String,
    productCode: { type: String, required: true, unique: true, trim: true, uppercase: true },
    productName: String,
    revision: { type: String, default: 'Rev A' },
    effectiveFrom: Date,
    standardQty: { type: Number, default: 1 },
    rawMaterials: [bomRawLineSchema],
    consumables: [bomConsumableLineSchema],
    rawMaterialAmount: { type: Number, default: 0 },
    productionAmount: { type: Number, default: 0 },
    status: { type: String, default: 'active' }
  },
  { timestamps: true }
);

export const Bom = mongoose.model('Bom', bomSchema);
