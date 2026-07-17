/** Default statutory rates (India — configurable per employee; verify for your state/rules). */
export const PAYROLL_DEFAULTS = Object.freeze({
  pfEmployeeRate: 0.12,
  pfWageCeiling: 15000,
  esiEmployeeRate: 0.0075,
  esiGrossCeiling: 21000,
  professionalTaxMonthly: 200,
  professionalTaxGrossThreshold: 10000,
  standardDeductionMonthly: 0,
  defaultPaidDaysPerMonth: 26,
  workingHoursPerDay: 8
});

export const ATTENDANCE_STATUSES = Object.freeze([
  'present',
  'absent',
  'leave',
  'holiday',
  'half_day'
]);

export const PAYROLL_RUN_STATUSES = Object.freeze(['draft', 'processed', 'paid', 'cancelled']);
