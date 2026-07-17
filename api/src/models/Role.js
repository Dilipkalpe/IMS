import mongoose from 'mongoose';
import { getConfigConnection } from '../config/db.js';

const roleSchema = new mongoose.Schema(
  {
    roleName: { type: String, required: true, trim: true },
    isActive: { type: Boolean, default: true },
    isDeleted: { type: Boolean, default: false },
    isSystem: { type: Boolean, default: false },
    createdBy: { type: String, default: null },
    createdDate: { type: Date, default: () => new Date() },
    modifiedBy: { type: String, default: null },
    modifiedDate: { type: Date, default: null }
  },
  { collection: 'Role_Master' }
);

roleSchema.index({ roleName: 1 }, { unique: true, partialFilterExpression: { isDeleted: false } });

const conn = getConfigConnection();
export const Role = conn.model('Role', roleSchema);
