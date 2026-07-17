import mongoose from 'mongoose';
import { EMPLOYEE_TYPES, DEFAULT_EMPLOYEE_TYPE } from '../constants/payrollEmployeeTypes.js';

const payrollEmployeeSchema = new mongoose.Schema(
  {
    employeeCode: { type: String, required: true, unique: true, trim: true, uppercase: true },
    fullName: { type: String, required: true, trim: true },
    employeeType: { type: String, enum: EMPLOYEE_TYPES, default: DEFAULT_EMPLOYEE_TYPE },
    monthlySalary: { type: Number, default: 0 },
    dailyWage: { type: Number, default: 0 },
    contractStartDate: { type: Date },
    contractEndDate: { type: Date },
    department: { type: String, default: '' },
    designation: { type: String, default: '' },
    email: { type: String, default: '' },
    phone: { type: String, default: '' },
    dateOfJoining: { type: Date },
    dateOfLeaving: { type: Date },
    bankAccountNo: { type: String, default: '' },
    bankIfsc: { type: String, default: '' },
    panNo: { type: String, trim: true, uppercase: true, default: '' },
    uanNo: { type: String, default: '' },
    esiNo: { type: String, default: '' },
    linkedUserEmployeeId: { type: String, trim: true, default: '' },
    payableAccountCode: { type: String, trim: true, uppercase: true, default: '' },
    payableAccountName: { type: String, trim: true, default: '' },
    basicSalary: { type: Number, default: 0 },
    hraPercent: { type: Number, default: 40 },
    hraAmount: { type: Number, default: 0 },
    otherAllowances: { type: Number, default: 0 },
    bonusPercent: { type: Number, default: 0 },
    otherDeductions: { type: Number, default: 0 },
    otRatePerHour: { type: Number, default: 0 },
    paidDaysPerMonth: { type: Number, default: 26 },
    tdsPercent: { type: Number, default: 0 },
    professionalTaxAmount: { type: Number, default: 200 },
    pfApplicable: { type: Boolean, default: true },
    esiApplicable: { type: Boolean, default: true },
    ptApplicable: { type: Boolean, default: true },
    stateCode: { type: String, default: 'MH' },
    activeStatus: { type: Boolean, default: true }
  },
  { timestamps: true }
);

payrollEmployeeSchema.index({ fullName: 'text', department: 'text' });

export const PayrollEmployee = mongoose.model('PayrollEmployee', payrollEmployeeSchema);
