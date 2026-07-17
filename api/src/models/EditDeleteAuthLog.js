import mongoose from 'mongoose';

const editDeleteAuthLogSchema = new mongoose.Schema(
  {
    action: { type: String, enum: ['edit', 'delete'], required: true },
    module: { type: String, trim: true, default: '' },
    recordKey: { type: String, trim: true, default: '' },
    success: { type: Boolean, required: true },
    username: { type: String, trim: true, default: '' },
    userId: { type: String, trim: true, default: '' },
    role: { type: String, trim: true, default: '' },
    ipAddress: { type: String, trim: true, default: '' },
    userAgent: { type: String, trim: true, default: '' }
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

editDeleteAuthLogSchema.index({ createdAt: -1 });
editDeleteAuthLogSchema.index({ action: 1, success: 1, createdAt: -1 });

export const EditDeleteAuthLog = mongoose.model('EditDeleteAuthLog', editDeleteAuthLogSchema);
