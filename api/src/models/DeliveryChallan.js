import mongoose from 'mongoose';
import { deliveryChallanHeaderFields } from '../schemas/deliveryChallanSchemas.js';

const deliveryChallanSchema = new mongoose.Schema(
  {
    ...deliveryChallanHeaderFields,
    dcDate: { type: Date, default: () => new Date() },
    warehouse: { type: String, trim: true, default: '' },
    vehicleNo: { type: String, trim: true, default: '' },
    transporter: { type: String, trim: true, default: '' }
  },
  { timestamps: true }
);

deliveryChallanSchema.index({ docPrefix: 1, docNo: 1 }, { unique: true });
deliveryChallanSchema.index({
  customer: 'text',
  salesMan: 'text',
  narration: 'text',
  formattedDocNo: 'text',
  soReference: 'text',
  warehouse: 'text'
});

export const DeliveryChallan = mongoose.model('DeliveryChallan', deliveryChallanSchema);
