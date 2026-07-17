import { Account } from '../models/Account.js';
import { PayrollEmployee } from '../models/PayrollEmployee.js';
import { AttendanceRecord } from '../models/AttendanceRecord.js';
import { PayrollRun } from '../models/PayrollRun.js';
import {
  generateAttendanceSlice,
  generatePayrollEmployees,
  generatePayrollRuns,
  mergeAttendanceBuckets,
  payrollPayableAccounts,
  resolvePayrollEmployeeCount
} from './generatePayrollData.js';
import { insertManyInBatches } from './insertBatches.js';

const GENERATE_CHUNK = Number(process.env.SEED_GENERATE_CHUNK) || 10_000;

/**
 * @param {{ months: number, attendanceCount: number, startDate: Date, endDate: Date }} options
 */
export async function seedPayrollData(options) {
  const { months, attendanceCount, startDate, endDate } = options;
  const spanDays = Math.max(
    1,
    Math.floor((endDate.getTime() - startDate.getTime()) / (24 * 60 * 60 * 1000))
  );
  const employeeCount = resolvePayrollEmployeeCount(attendanceCount, months, spanDays);
  const range = { startDate, endDate };

  console.log(
    `\nPayroll seed: ${employeeCount.toLocaleString()} employees, ${attendanceCount.toLocaleString()} attendance rows, ${months} monthly runs…`
  );

  const employees = generatePayrollEmployees(employeeCount, range);
  const payableAccounts = payrollPayableAccounts(employees);

  for (const acc of payableAccounts) {
    const exists = await Account.findOne({ code: acc.code }).lean();
    if (!exists) await Account.create(acc);
  }

  await PayrollEmployee.insertMany(employees);

  const attendanceBuckets = new Map();
  for (let offset = 0; offset < attendanceCount; offset += GENERATE_CHUNK) {
    const count = Math.min(GENERATE_CHUNK, attendanceCount - offset);
    const slice = generateAttendanceSlice(offset, count, employees, range);
    mergeAttendanceBuckets(attendanceBuckets, slice);
    await insertManyInBatches(AttendanceRecord, slice, {
      label: `attendance ${offset.toLocaleString()}–${(offset + count).toLocaleString()}`,
      batchSize: 5000
    });
  }

  const { runs, runNo } = generatePayrollRuns(employees, attendanceBuckets, {
    startDate,
    endDate,
    months
  });
  await PayrollRun.insertMany(runs);

  attendanceBuckets.clear();

  return {
    payrollEmployees: employees.length,
    attendanceRecords: attendanceCount,
    payrollRuns: runs.length,
    payrollRunNo: runNo
  };
}
