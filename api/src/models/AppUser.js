import mongoose from 'mongoose';

const appUserSchema = new mongoose.Schema(
  {
    employeeId: {
      type: String,
      trim: true,
      uppercase: true,
      sparse: true,
      unique: true
    },
    username: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true
    },
    passwordHash: {
      type: String,
      select: false
    },
    fullName: {
      type: String,
      required: true,
      trim: true
    },
    role: {
      type: String,
      required: true,
      trim: true
    },
    roleId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Role',
      default: null
    },
    department: {
      type: String,
      trim: true,
      default: ''
    },
    email: {
      type: String,
      trim: true,
      lowercase: true
    },
    activeStatus: {
      type: Boolean,
      default: true
    },
    canPrintBarcodeLabels: {
      type: Boolean,
      default: false
    }
  },
  { timestamps: true }
);

appUserSchema.index({ fullName: 'text', username: 'text', role: 'text' });

export const AppUser = mongoose.model('AppUser', appUserSchema);
