import mongoose from 'mongoose';

const accountSchema = new mongoose.Schema(
  {
    accountType: { type: String, enum: ['customer', 'supplier'], required: true },
    code: { type: String, required: true, unique: true, trim: true, uppercase: true },
    name: { type: String, required: true, trim: true },
    contactPerson: String,
    designation: String,
    email: String,
    city: String,
    state: String,
    country: String,
    pincode: String,
    address: String,
    mobileNo: String,
    contactNo: String,
    fax: String,
    cstNo: String,
    tinNo: String,
    panNo: String,
    gstNo: String,
    exciseNo: String,
    creditLimit: { type: Number, default: 0 },
    creditDays: { type: Number, default: 0 },
    openingBalance: { type: Number, default: 0 },
    openingBalanceType: { type: String, enum: ['debit', 'credit'], default: 'debit' },
    customerType: String,
    annualTurnover: String,
    sourceEmployee: String,
    activeStatus: { type: Boolean, default: true },
    gstExempt: { type: Boolean, default: false },
    billFormatAssignments: {
      type: mongoose.Schema.Types.Mixed,
      default: () => ({})
    }
  },
  { timestamps: true }
);

export const Account = mongoose.model('Account', accountSchema);
