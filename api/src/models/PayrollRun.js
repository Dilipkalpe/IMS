import mongoose from 'mongoose';
import { PAYROLL_RUN_STATUSES } from '../constants/payrollDefaults.js';

const payrollLineSchema = new mongoose.Schema(
  {
    employeeCode: String,
    employeeName: String,
    employeeType: { type: String, default: 'permanent' },
    employeeTypeLabel: { type: String, default: '' },
    department: String,
    designation: String,
    panNo: String,
    uanNo: String,
    esiNo: String,
    daysPresent: { type: Number, default: 0 },
    daysAbsent: { type: Number, default: 0 },
    daysLeave: { type: Number, default: 0 },
    paidDays: { type: Number, default: 0 },
    workedHours: { type: Number, default: 0 },
    otHours: { type: Number, default: 0 },
    earnings: {
      basic: { type: Number, default: 0 },
      hra: { type: Number, default: 0 },
      allowances: { type: Number, default: 0 },
      bonus: { type: Number, default: 0 },
      overtime: { type: Number, default: 0 },
      gross: { type: Number, default: 0 }
    },
    deductions: {
      pf: { type: Number, default: 0 },
      esi: { type: Number, default: 0 },
      professionalTax: { type: Number, default: 0 },
      tds: { type: Number, default: 0 },
      other: { type: Number, default: 0 },
      total: { type: Number, default: 0 }
    },
    taxableIncome: { type: Number, default: 0 },
    netPay: { type: Number, default: 0 },
    payslipNo: { type: String, default: '' }
  },
  { _id: false }
);

const payrollRunSchema = new mongoose.Schema(
  {
    runNo: { type: Number, required: true, unique: true },
    periodMonth: { type: String, required: true, trim: true },
    periodFrom: { type: Date, required: true },
    periodTo: { type: Date, required: true },
    processedAt: { type: Date },
    processedBy: { type: String, default: '' },
    status: { type: String, enum: PAYROLL_RUN_STATUSES, default: 'draft' },
    employeeCount: { type: Number, default: 0 },
    totalGross: { type: Number, default: 0 },
    totalDeductions: { type: Number, default: 0 },
    totalNet: { type: Number, default: 0 },
    totalTds: { type: Number, default: 0 },
    totalPf: { type: Number, default: 0 },
    totalEsi: { type: Number, default: 0 },
    remark: { type: String, default: '' },
    paidAt: { type: Date },
    paidBy: { type: String, default: '' },
    cashBank: { type: String, default: 'BANK' },
    paymentMode: { type: String, default: 'per_employee' },
    consolidatedAccountCode: { type: String, default: 'SAL-PAYROLL' },
    paymentVoucherNos: { type: [Number], default: [] },
    receiptVoucherNos: { type: [Number], default: [] },
    statutoryVoucherNos: { type: [Number], default: [] },
    lines: { type: [payrollLineSchema], default: [] }
  },
  { timestamps: true }
);

payrollRunSchema.index({ periodMonth: 1 });
payrollRunSchema.index({ status: 1 });

export const PayrollRun = mongoose.model('PayrollRun', payrollRunSchema);
