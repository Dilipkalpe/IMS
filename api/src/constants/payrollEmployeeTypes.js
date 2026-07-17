export const EMPLOYEE_TYPES = Object.freeze(['permanent', 'temporary', 'daily']);

export const EMPLOYEE_TYPE_LABELS = Object.freeze({
  permanent: 'Permanent',
  temporary: 'Temporary',
  daily: 'Daily Wage',
});

export const DEFAULT_EMPLOYEE_TYPE = 'permanent';

export function normalizeEmployeeType(value) {
  const raw = String(value ?? DEFAULT_EMPLOYEE_TYPE).trim().toLowerCase();
  if (EMPLOYEE_TYPES.includes(raw)) return raw;
  return DEFAULT_EMPLOYEE_TYPE;
}

export function employeeTypeLabel(value) {
  return EMPLOYEE_TYPE_LABELS[normalizeEmployeeType(value)] ?? EMPLOYEE_TYPE_LABELS.permanent;
}
