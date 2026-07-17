import mongoose from 'mongoose';
import { getConfigConnection } from '../config/db.js';

const menuMasterSchema = new mongoose.Schema(
  {
    menuKey: { type: String, required: true, trim: true, unique: true },
    menuName: { type: String, required: true, trim: true },
    parentMenuId: { type: mongoose.Schema.Types.ObjectId, ref: 'MenuMaster', default: null },
    parentMenuKey: { type: String, default: null },
    menuUrl: { type: String, default: '' },
    menuOrder: { type: Number, default: 0 },
    icon: { type: String, default: '' },
    isActive: { type: Boolean, default: true },
    isSection: { type: Boolean, default: false }
  },
  { collection: 'Menu_Master' }
);

menuMasterSchema.index({ parentMenuId: 1, menuOrder: 1 });
menuMasterSchema.index({ parentMenuKey: 1, menuOrder: 1 });

const conn = getConfigConnection();
export const MenuMaster = conn.model('MenuMaster', menuMasterSchema);
