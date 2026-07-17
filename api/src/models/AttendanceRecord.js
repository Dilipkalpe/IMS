import mongoose from 'mongoose';
import { ATTENDANCE_STATUSES } from '../constants/payrollDefaults.js';

const attendanceRecordSchema = new mongoose.Schema(
  {
    employeeCode: { type: String, required: true, trim: true, uppercase: true },
    employeeName: { type: String, default: '' },
    attendanceDate: { type: Date, required: true },
    status: { type: String, enum: ATTENDANCE_STATUSES, default: 'present' },
    checkIn: { type: String, default: '' },
    checkOut: { type: String, default: '' },
    workedHours: { type: Number, default: 8 },
    overtimeHours: { type: Number, default: 0 },
    remark: { type: String, default: '' }
  },
  { timestamps: true }
);

attendanceRecordSchema.index({ employeeCode: 1, attendanceDate: 1 }, { unique: true });
attendanceRecordSchema.index({ attendanceDate: 1 });

export const AttendanceRecord = mongoose.model('AttendanceRecord', attendanceRecordSchema);
