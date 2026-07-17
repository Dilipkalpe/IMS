import mongoose from 'mongoose';

/**
 * Sales bill print template — layout stored as JSON (layoutJson).
 * Collection: salesbilltemplates (year-scoped DB after auth switches year).
 */
const salesBillTemplateSchema = new mongoose.Schema(
  {
    templateKey: {
      type: String,
      required: true,
      trim: true,
      lowercase: true
    },
    formatCode: {
      type: String,
      trim: true,
      uppercase: true,
      default: ''
    },
    transactionType: {
      type: String,
      trim: true,
      lowercase: true,
      default: 'sales_invoice'
    },
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 120
    },
    description: {
      type: String,
      trim: true,
      default: '',
      maxlength: 500
    },
    appliesToDocTypes: {
      type: [String],
      default: ['sales_invoice', 'sales_order', 'delivery_challan', 'sales_return']
    },
    isSystem: {
      type: Boolean,
      default: false
    },
    isDefault: {
      type: Boolean,
      default: false
    },
    isActive: {
      type: Boolean,
      default: true
    },
    printSettings: {
      type: mongoose.Schema.Types.Mixed,
      default: () => ({})
    },
    visibilityRules: {
      type: mongoose.Schema.Types.Mixed,
      default: () => ({})
    },
    layoutJson: {
      type: mongoose.Schema.Types.Mixed,
      required: true
    },
    version: {
      type: Number,
      default: 1
    },
    updatedBy: {
      type: String,
      trim: true,
      default: ''
    }
  },
  {
    timestamps: true,
    collection: 'salesbilltemplates'
  }
);

salesBillTemplateSchema.index({ templateKey: 1 }, { unique: true });
salesBillTemplateSchema.index({ formatCode: 1 });
salesBillTemplateSchema.index({ transactionType: 1, isDefault: 1 });
salesBillTemplateSchema.index({ isDefault: 1 });
salesBillTemplateSchema.index({ isActive: 1 });

export const SalesBillTemplate = mongoose.model('SalesBillTemplate', salesBillTemplateSchema);
