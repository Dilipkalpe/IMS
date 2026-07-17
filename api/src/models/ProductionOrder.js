import mongoose from 'mongoose';
import { MATERIAL_STAGES } from '../constants/materialStages.js';

const materialStageEventSchema = new mongoose.Schema(
  {
    stage: { type: String, required: true },
    at: { type: Date, default: () => new Date() },
    by: { type: String, default: '' },
    qty: { type: Number, default: 0 },
    godown: { type: String, default: '' },
    note: { type: String, default: '' }
  },
  { _id: false }
);

const materialLineTrackingFields = {
  bomLineRef: { type: String, default: '' },
  assignmentType: { type: String, enum: ['bom', 'manual', 'override'], default: 'bom' },
  stage: { type: String, enum: MATERIAL_STAGES, default: 'planned' },
  stageEvents: { type: [materialStageEventSchema], default: [] }
};

const productionRawLineSchema = new mongoose.Schema(
  {
    srNo: Number,
    itemId: String,
    itemName: String,
    unit: String,
    reqQty: { type: Number, default: 0 },
    availableQty: { type: Number, default: 0 },
    rate: { type: Number, default: 0 },
    amount: { type: Number, default: 0 },
    ...materialLineTrackingFields
  },
  { _id: false }
);

const productionConsumableLineSchema = new mongoose.Schema(
  {
    srNo: Number,
    material: String,
    qty: { type: Number, default: 0 },
    rate: { type: Number, default: 0 },
    amount: { type: Number, default: 0 },
    ...materialLineTrackingFields
  },
  { _id: false }
);

const productionOrderSchema = new mongoose.Schema(
  {
    productionNo: { type: Number, required: true, unique: true },
    productionDate: { type: Date, default: () => new Date() },
    manufacturingItemId: { type: String, trim: true, default: '' },
    manufacturingItemName: { type: String, trim: true, default: '' },
    bomProductCode: { type: String, trim: true, uppercase: true, default: '' },
    bomRevision: { type: String, trim: true, default: 'Rev A' },
    machineCode: { type: String, trim: true, default: '' },
    machineName: { type: String, trim: true, default: '' },
    operatorId: { type: String, trim: true, default: '' },
    operatorName: { type: String, trim: true, default: '' },
    startTimeText: { type: String, default: '' },
    endTimeText: { type: String, default: '' },
    totalDurationMinutes: { type: Number, default: 0 },
    produceQty: { type: Number, default: 0 },
    rejectedQty: { type: Number, default: 0 },
    finalQty: { type: Number, default: 0 },
    fromGodown: { type: String, trim: true, default: 'Counter' },
    rawMaterialAmount: { type: Number, default: 0 },
    productionAmount: { type: Number, default: 0 },
    rawMaterials: { type: [productionRawLineSchema], default: [] },
    consumables: { type: [productionConsumableLineSchema], default: [] },
    issueTransferEntryNo: { type: String, trim: true, default: '' },
    receiptTransferEntryNo: { type: String, trim: true, default: '' },
    status: {
      type: String,
      enum: ['Open', 'In Progress', 'Completed', 'Cancelled'],
      default: 'Open'
    }
  },
  { timestamps: true }
);

productionOrderSchema.index({ manufacturingItemId: 1 });
productionOrderSchema.index({ status: 1 });
productionOrderSchema.index({ productionDate: -1 });

export const ProductionOrder = mongoose.model('ProductionOrder', productionOrderSchema);
