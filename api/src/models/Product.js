import mongoose from 'mongoose';

const productSchema = new mongoose.Schema(
  {
    code: { type: String, required: true, unique: true, trim: true, uppercase: true },
    name: { type: String, required: true, trim: true },
    category: { type: String, default: 'General' },
    unit: { type: String, default: 'EA' },
    size: String,
    length: String,
    brand: String,
    hsnCode: String,
    salePrice: { type: Number, default: 0 },
    purchasePrice: { type: Number, default: 0 },
    reorderQty: { type: Number, default: 0 },
    minOrderQty: { type: Number, default: 0 },
    cgst: { type: Number, default: 0 },
    sgst: { type: Number, default: 0 },
    igst: { type: Number, default: 0 },
    productType: String,
    productMainGroup: String,
    productSubGroup: String,
    assemblyType: String,
    saleUom: String,
    purchaseUom: String,
    serialApplicable: { type: Boolean, default: false },
    gstExempt: { type: Boolean, default: false },
    activeStatus: { type: Boolean, default: true },
    productImage: String,
    taxType: { type: String, default: 'GST' },
    taxPercent: { type: String, default: '18' },
    stockQty: { type: Number, default: 0 }
  },
  { timestamps: true }
);

productSchema.index({ name: 'text', code: 'text' });

export const Product = mongoose.model('Product', productSchema);
