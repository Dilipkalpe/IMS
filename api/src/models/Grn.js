import mongoose from 'mongoose';
import { grnHeaderFields } from '../schemas/grnSchemas.js';

const grnSchema = new mongoose.Schema(
  {
    ...grnHeaderFields,
    grnDate: { type: Date, default: () => new Date() },
    warehouse: { type: String, trim: true, default: '' },
    vehicleNo: { type: String, trim: true, default: '' },
    transporter: { type: String, trim: true, default: '' }
  },
  { timestamps: true }
);

grnSchema.index({ docPrefix: 1, docNo: 1 }, { unique: true });
grnSchema.index({ supplier: 'text', poReference: 'text', warehouse: 'text', formattedDocNo: 'text' });

export const Grn = mongoose.model('Grn', grnSchema);
