import test from 'node:test';
import assert from 'node:assert/strict';
import {
  calcEmployeePayrollLine,
  periodBoundsFromMonth,
  summarizeAttendance,
} from './payrollCalc.js';
import {
  calcTemporaryProrateFactor,
  daysInclusive,
} from './payrollSalaryByType.js';
import {
  normalizePayrollEmployeePayload,
  validatePayrollEmployee,
} from './payrollEmployeeValidation.js';

test('validatePayrollEmployee enforces type-specific salary fields', () => {
  const permanent = validatePayrollEmployee(
    normalizePayrollEmployeePayload({
      employeeCode: 'E1',
      fullName: 'Permanent Worker',
      employeeType: 'permanent',
      monthlySalary: 30000,
    }),
  );
  assert.equal(permanent.ok, true);

  const missingSalary = validatePayrollEmployee(
    normalizePayrollEmployeePayload({
      employeeCode: 'E2',
      fullName: 'Temp Worker',
      employeeType: 'temporary',
    }),
  );
  assert.equal(missingSalary.ok, false);

  const temporary = validatePayrollEmployee(
    normalizePayrollEmployeePayload({
      employeeCode: 'E3',
      fullName: 'Temp Worker',
      employeeType: 'temporary',
      monthlySalary: 20000,
      contractStartDate: '2026-01-01',
      contractEndDate: '2026-01-31',
    }),
  );
  assert.equal(temporary.ok, true);

  const daily = validatePayrollEmployee(
    normalizePayrollEmployeePayload({
      employeeCode: 'E4',
      fullName: 'Daily Worker',
      employeeType: 'daily',
      dailyWage: 800,
    }),
  );
  assert.equal(daily.ok, true);
});

test('temporary prorate uses contract overlap within payroll month', () => {
  const { periodFrom, periodTo } = periodBoundsFromMonth('2026-01');
  const employee = {
    contractStartDate: new Date('2026-01-16'),
    contractEndDate: new Date('2026-01-31'),
  };
  const factor = calcTemporaryProrateFactor(employee, periodFrom, periodTo);
  const monthDays = daysInclusive(periodFrom, periodTo);
  const eligible = daysInclusive(new Date('2026-01-16'), periodTo);
  assert.equal(factor, eligible / monthDays);
});

test('daily wage payroll uses paid attendance days', () => {
  const employee = {
    employeeCode: 'DW-1',
    fullName: 'Daily Worker',
    employeeType: 'daily',
    dailyWage: 500,
    pfApplicable: false,
    esiApplicable: false,
    ptApplicable: false,
    otherDeductions: 0,
    tdsPercent: 0,
  };
  const attendance = summarizeAttendance(
    [
      { attendanceDate: '2026-01-02', status: 'present' },
      { attendanceDate: '2026-01-03', status: 'present' },
      { attendanceDate: '2026-01-04', status: 'absent' },
    ],
    new Date('2026-01-01'),
    new Date('2026-01-31'),
  );
  const line = calcEmployeePayrollLine(employee, attendance, {
    periodFrom: new Date('2026-01-01'),
    periodTo: new Date('2026-01-31'),
  });
  assert.equal(line.employeeType, 'daily');
  assert.equal(line.earnings.basic, 1000);
  assert.equal(line.netPay, 1000);
});

test('permanent employee applies attendance to monthly salary', () => {
  const employee = {
    employeeCode: 'P-1',
    fullName: 'Permanent Worker',
    employeeType: 'permanent',
    monthlySalary: 26000,
    paidDaysPerMonth: 26,
    hraPercent: 0,
    otherAllowances: 0,
    pfApplicable: false,
    esiApplicable: false,
    ptApplicable: false,
    otherDeductions: 0,
    tdsPercent: 0,
  };
  const attendance = summarizeAttendance(
    [{ attendanceDate: '2026-01-02', status: 'present' }],
    new Date('2026-01-01'),
    new Date('2026-01-31'),
  );
  const line = calcEmployeePayrollLine(employee, attendance, {
    periodFrom: new Date('2026-01-01'),
    periodTo: new Date('2026-01-31'),
  });
  assert.equal(line.employeeType, 'permanent');
  assert.equal(line.earnings.basic, 1000);
});
