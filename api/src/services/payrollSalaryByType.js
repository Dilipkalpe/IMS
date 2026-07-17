import { normalizeEmployeeType } from '../constants/payrollEmployeeTypes.js';
import { resolveMonthlySalary } from './payrollEmployeeValidation.js';

function round2(n) {
  return Math.round((Number(n) + Number.EPSILON) * 100) / 100;
}

export function daysInclusive(from, to) {
  const start = new Date(from);
  const end = new Date(to);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || end < start) return 0;
  start.setUTCHours(0, 0, 0, 0);
  end.setUTCHours(0, 0, 0, 0);
  return Math.floor((end.getTime() - start.getTime()) / 86400000) + 1;
}

export function clipDateRange(rangeStart, rangeEnd, clipStart, clipEnd) {
  let from = new Date(rangeStart);
  let to = new Date(rangeEnd);
  if (clipStart) {
    const cs = new Date(clipStart);
    if (cs > from) from = cs;
  }
  if (clipEnd) {
    const ce = new Date(clipEnd);
    if (ce < to) to = ce;
  }
  if (from > to) return null;
  return { from, to };
}

export function calcHra(monthlyBase, employee) {
  const pct = Number(employee.hraPercent) || 0;
  if (pct > 0) return round2(monthlyBase * (pct / 100));
  return round2(Number(employee.hraAmount) || 0);
}

export function calcAttendanceDayFactor(attendanceSummary, employee, cfg) {
  const paidDays = Number(attendanceSummary.paidDays) || 0;
  const standardDays = Number(employee.paidDaysPerMonth) || cfg.defaultPaidDaysPerMonth;
  if (standardDays <= 0) return 1;
  return Math.min(1, paidDays / standardDays);
}

/** Contract + join/leave overlap within payroll month (calendar days). */
export function calcTemporaryEligibleDays(employee, periodFrom, periodTo) {
  const clipped = clipDateRange(periodFrom, periodTo, employee.contractStartDate, employee.contractEndDate);
  if (!clipped) return 0;

  let { from, to } = clipped;
  if (employee.dateOfJoining) {
    const join = new Date(employee.dateOfJoining);
    if (join > from) from = join;
  }
  if (employee.dateOfLeaving) {
    const leave = new Date(employee.dateOfLeaving);
    if (leave < to) to = leave;
  }
  if (from > to) return 0;
  return daysInclusive(from, to);
}

export function calcTemporaryProrateFactor(employee, periodFrom, periodTo) {
  const monthDays = daysInclusive(periodFrom, periodTo);
  if (monthDays <= 0) return 0;
  const eligibleDays = calcTemporaryEligibleDays(employee, periodFrom, periodTo);
  return eligibleDays / monthDays;
}

/**
 * Computes earned basic/HRA/allowances before bonus, OT, and statutory deductions.
 */
export function calcEarnedCompensation(employee, attendanceSummary, options = {}) {
  const cfg = options.cfg ?? {};
  const employeeType = normalizeEmployeeType(employee.employeeType);
  const monthlySalary = resolveMonthlySalary(employee);
  const allowances = round2(Number(employee.otherAllowances) || 0);
  const hraMonthly = calcHra(monthlySalary, employee);
  const paidDays = Number(attendanceSummary.paidDays) || 0;
  const periodFrom = options.periodFrom;
  const periodTo = options.periodTo;

  if (employeeType === 'daily') {
    const dailyWage = round2(Number(employee.dailyWage) || 0);
    const earnedBasic = round2(dailyWage * paidDays);
    return {
      employeeType,
      salaryCalcMethod: 'daily_wage',
      earnedBasic,
      earnedHra: 0,
      earnedAllowances: allowances,
      contractProrateFactor: null,
      attendanceDayFactor: paidDays,
    };
  }

  if (employeeType === 'temporary') {
    const contractFactor =
      periodFrom && periodTo ? calcTemporaryProrateFactor(employee, periodFrom, periodTo) : 1;
    const eligibleDays =
      periodFrom && periodTo ? calcTemporaryEligibleDays(employee, periodFrom, periodTo) : 0;
    const attendanceFactor =
      eligibleDays > 0 ? Math.min(1, paidDays / eligibleDays) : calcAttendanceDayFactor(attendanceSummary, employee, cfg);
    const combinedFactor = round2(contractFactor * attendanceFactor);
    const proratedMonthly = round2(monthlySalary * contractFactor);
    return {
      employeeType,
      salaryCalcMethod: 'temporary_contract',
      earnedBasic: round2(proratedMonthly * attendanceFactor),
      earnedHra: round2(hraMonthly * combinedFactor),
      earnedAllowances: round2(allowances * combinedFactor),
      contractProrateFactor: round2(contractFactor),
      attendanceDayFactor: round2(attendanceFactor),
      eligibleContractDays: eligibleDays,
    };
  }

  const attendanceFactor = calcAttendanceDayFactor(attendanceSummary, employee, cfg);
  return {
    employeeType,
    salaryCalcMethod: 'permanent_monthly',
    earnedBasic: round2(monthlySalary * attendanceFactor),
    earnedHra: round2(hraMonthly * attendanceFactor),
    earnedAllowances: round2(allowances * attendanceFactor),
    contractProrateFactor: null,
    attendanceDayFactor: round2(attendanceFactor),
  };
}
