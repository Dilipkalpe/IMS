import { PAYROLL_DEFAULTS } from '../constants/payrollDefaults.js';
import { employeeTypeLabel, normalizeEmployeeType } from '../constants/payrollEmployeeTypes.js';
import { resolveMonthlySalary } from './payrollEmployeeValidation.js';
import { calcEarnedCompensation } from './payrollSalaryByType.js';

function round2(n) {
  return Math.round((Number(n) + Number.EPSILON) * 100) / 100;
}

export { daysInclusive, calcTemporaryProrateFactor, calcTemporaryEligibleDays } from './payrollSalaryByType.js';

export function summarizeAttendance(records, periodFrom, periodTo) {
  const from = new Date(periodFrom);
  const to = new Date(periodTo);
  let daysPresent = 0;
  let daysAbsent = 0;
  let daysLeave = 0;
  let daysHoliday = 0;
  let halfDays = 0;
  let workedHours = 0;
  let otHours = 0;

  for (const r of records ?? []) {
    const d = new Date(r.attendanceDate);
    if (d < from || d > to) continue;
    const status = String(r.status || 'present').toLowerCase();
    if (status === 'present') daysPresent += 1;
    else if (status === 'absent') daysAbsent += 1;
    else if (status === 'leave') daysLeave += 1;
    else if (status === 'holiday') daysHoliday += 1;
    else if (status === 'half_day') halfDays += 1;
    workedHours += Number(r.workedHours) || 0;
    otHours += Number(r.overtimeHours) || 0;
  }

  const paidDays = daysPresent + daysHoliday + halfDays * 0.5 + daysLeave * 0;
  return {
    daysPresent,
    daysAbsent,
    daysLeave,
    daysHoliday,
    halfDays,
    paidDays: round2(paidDays),
    workedHours: round2(workedHours),
    otHours: round2(otHours),
  };
}

export function calcHra(basic, employee) {
  const pct = Number(employee.hraPercent) || 0;
  if (pct > 0) return round2(basic * (pct / 100));
  return round2(Number(employee.hraAmount) || 0);
}

export function calcEmployeePayrollLine(employee, attendanceSummary, options = {}) {
  const cfg = { ...PAYROLL_DEFAULTS, ...options };
  const employeeType = normalizeEmployeeType(employee.employeeType);
  const monthlySalary = resolveMonthlySalary(employee);
  const earned = calcEarnedCompensation(employee, attendanceSummary, {
    cfg,
    periodFrom: options.periodFrom,
    periodTo: options.periodTo,
  });

  const bonusPct = Number(options.bonusPercent) || Number(employee.bonusPercent) || 0;
  const bonusBase =
    employeeType === 'daily' ? earned.earnedBasic : monthlySalary * (earned.contractProrateFactor ?? earned.attendanceDayFactor ?? 1);
  const bonus = round2(bonusBase * (bonusPct / 100));

  const otRateBase = employeeType === 'daily' ? Number(employee.dailyWage) || 0 : monthlySalary;
  const otRate =
    Number(employee.otRatePerHour) ||
    round2(otRateBase / (cfg.defaultPaidDaysPerMonth * cfg.workingHoursPerDay));
  const otPay = round2((attendanceSummary.otHours || 0) * otRate);

  const earnedBasic = earned.earnedBasic;
  const earnedHra = earned.earnedHra;
  const earnedAllowances = earned.earnedAllowances;
  const gross = round2(earnedBasic + earnedHra + earnedAllowances + bonus + otPay);

  const pfWage = Math.min(earnedBasic, cfg.pfWageCeiling);
  const pfEmployee = employee.pfApplicable === false ? 0 : round2(pfWage * cfg.pfEmployeeRate);
  const esiEmployee =
    employee.esiApplicable === false || gross > cfg.esiGrossCeiling
      ? 0
      : round2(gross * cfg.esiEmployeeRate);
  const professionalTax =
    employee.ptApplicable === false || gross <= cfg.professionalTaxGrossThreshold
      ? 0
      : round2(Number(employee.professionalTaxAmount) || cfg.professionalTaxMonthly);

  const hraExempt = Math.min(earnedHra, round2(earnedBasic * 0.5));
  const taxableIncome = Math.max(0, gross - hraExempt - cfg.standardDeductionMonthly);
  const tdsRate = Number(employee.tdsPercent) || 0;
  const tds = round2(taxableIncome * (tdsRate / 100));

  const otherDeductions = round2(Number(employee.otherDeductions) || 0);
  const totalDeductions = round2(pfEmployee + esiEmployee + professionalTax + tds + otherDeductions);
  const netPay = round2(gross - totalDeductions);

  return {
    employeeCode: employee.employeeCode,
    employeeName: employee.fullName,
    employeeType,
    employeeTypeLabel: employeeTypeLabel(employeeType),
    department: employee.department || '',
    designation: employee.designation || '',
    panNo: employee.panNo || '',
    uanNo: employee.uanNo || '',
    esiNo: employee.esiNo || '',
    monthlySalary: employeeType === 'daily' ? 0 : monthlySalary,
    dailyWage: employeeType === 'daily' ? round2(Number(employee.dailyWage) || 0) : 0,
    salaryCalcMethod: earned.salaryCalcMethod,
    contractProrateFactor: earned.contractProrateFactor,
    daysPresent: attendanceSummary.daysPresent,
    daysAbsent: attendanceSummary.daysAbsent,
    daysLeave: attendanceSummary.daysLeave,
    paidDays: attendanceSummary.paidDays,
    workedHours: attendanceSummary.workedHours,
    otHours: attendanceSummary.otHours,
    earnings: {
      basic: earnedBasic,
      hra: earnedHra,
      allowances: earnedAllowances,
      bonus,
      overtime: otPay,
      gross,
    },
    deductions: {
      pf: pfEmployee,
      esi: esiEmployee,
      professionalTax,
      tds,
      other: otherDeductions,
      total: totalDeductions,
    },
    taxableIncome: round2(taxableIncome),
    netPay,
  };
}

export function periodBoundsFromMonth(periodMonth) {
  const [y, m] = String(periodMonth).split('-').map(Number);
  if (!y || !m || m < 1 || m > 12) {
    throw Object.assign(new Error('periodMonth must be YYYY-MM'), { status: 400 });
  }
  const periodFrom = new Date(Date.UTC(y, m - 1, 1));
  const periodTo = new Date(Date.UTC(y, m, 0, 23, 59, 59, 999));
  return { periodFrom, periodTo, periodMonth: `${y}-${String(m).padStart(2, '0')}` };
}
