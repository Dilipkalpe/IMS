export type PayrollEmployeeType = 'permanent' | 'temporary' | 'daily';

export const PAYROLL_EMPLOYEE_TYPES: PayrollEmployeeType[] = ['permanent', 'temporary', 'daily'];

export const PAYROLL_EMPLOYEE_TYPE_LABELS: Record<PayrollEmployeeType, string> = {
  permanent: 'Permanent',
  temporary: 'Temporary',
  daily: 'Daily Wage',
};

export function normalizePayrollEmployeeType(value: unknown): PayrollEmployeeType {
  const raw = String(value ?? 'permanent').trim().toLowerCase();
  if (PAYROLL_EMPLOYEE_TYPES.includes(raw as PayrollEmployeeType)) return raw as PayrollEmployeeType;
  return 'permanent';
}

export function employeeTypeLabel(value: unknown): string {
  return PAYROLL_EMPLOYEE_TYPE_LABELS[normalizePayrollEmployeeType(value)];
}
