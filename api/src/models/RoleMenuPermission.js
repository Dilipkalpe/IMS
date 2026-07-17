import mongoose from 'mongoose';
import { getConfigConnection } from '../config/db.js';

const roleMenuPermissionSchema = new mongoose.Schema(
  {
    roleId: { type: mongoose.Schema.Types.ObjectId, ref: 'Role', required: true },
    menuId: { type: mongoose.Schema.Types.ObjectId, ref: 'MenuMaster', required: true },
    menuKey: { type: String, required: true, trim: true },
    canView: { type: Boolean, default: false },
    canAdd: { type: Boolean, default: false },
    canEdit: { type: Boolean, default: false },
    canDelete: { type: Boolean, default: false },
    canExport: { type: Boolean, default: false },
    createdDate: { type: Date, default: () => new Date() }
  },
  { collection: 'Role_Menu_Permission' }
);

roleMenuPermissionSchema.index({ roleId: 1, menuId: 1 }, { unique: true });
roleMenuPermissionSchema.index({ roleId: 1, menuKey: 1 });

const conn = getConfigConnection();
export const RoleMenuPermission = conn.model('RoleMenuPermission', roleMenuPermissionSchema);
