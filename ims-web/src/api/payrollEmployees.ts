import { apiFetch } from './client';
import type { PayrollEmployeeType } from '../payroll/payrollEmployeeTypes';

export interface PayrollEmployeeRecord {
  employeeCode: string;
  fullName: string;
  employeeType: PayrollEmployeeType;
  monthlySalary: number;
  dailyWage: number;
  contractStartDate?: string;
  contractEndDate?: string;
  department: string;
  designation: string;
  email?: string;
  phone?: string;
  panNo: string;
  uanNo?: string;
  esiNo?: string;
  payableAccountCode?: string;
  hraPercent: number;
  hraAmount?: number;
  otherAllowances: number;
  bonusPercent: number;
  otherDeductions: number;
  paidDaysPerMonth: number;
  tdsPercent: number;
  professionalTaxAmount?: number;
  pfApplicable: boolean;
  esiApplicable: boolean;
  ptApplicable: boolean;
  activeStatus: boolean;
}

function toDateInput(value: unknown): string {
  if (!value) return '';
  const d = new Date(String(value));
  if (Number.isNaN(d.getTime())) return '';
  return d.toISOString().slice(0, 10);
}

export function mapPayrollEmployeeRecord(raw: Record<string, unknown>): PayrollEmployeeRecord {
  return {
    employeeCode: String(raw.employeeCode ?? ''),
    fullName: String(raw.fullName ?? ''),
    employeeType: (String(raw.employeeType ?? 'permanent').toLowerCase() as PayrollEmployeeType) || 'permanent',
    monthlySalary: Number(raw.monthlySalary ?? raw.basicSalary ?? 0),
    dailyWage: Number(raw.dailyWage ?? 0),
    contractStartDate: toDateInput(raw.contractStartDate),
    contractEndDate: toDateInput(raw.contractEndDate),
    department: String(raw.department ?? ''),
    designation: String(raw.designation ?? ''),
    email: String(raw.email ?? ''),
    phone: String(raw.phone ?? ''),
    panNo: String(raw.panNo ?? ''),
    uanNo: String(raw.uanNo ?? ''),
    esiNo: String(raw.esiNo ?? ''),
    payableAccountCode: String(raw.payableAccountCode ?? ''),
    hraPercent: Number(raw.hraPercent ?? 40),
    hraAmount: Number(raw.hraAmount ?? 0),
    otherAllowances: Number(raw.otherAllowances ?? 0),
    bonusPercent: Number(raw.bonusPercent ?? 0),
    otherDeductions: Number(raw.otherDeductions ?? 0),
    paidDaysPerMonth: Number(raw.paidDaysPerMonth ?? 26),
    tdsPercent: Number(raw.tdsPercent ?? 0),
    professionalTaxAmount: Number(raw.professionalTaxAmount ?? 200),
    pfApplicable: raw.pfApplicable !== false,
    esiApplicable: raw.esiApplicable !== false,
    ptApplicable: raw.ptApplicable !== false,
    activeStatus: raw.activeStatus !== false,
  };
}

export async function getPayrollEmployeeByCode(code: string): Promise<PayrollEmployeeRecord> {
  const raw = await apiFetch<Record<string, unknown>>(`/api/payroll-employees/by-code/${encodeURIComponent(code)}`);
  return mapPayrollEmployeeRecord(raw);
}

export async function createPayrollEmployee(payload: PayrollEmployeeRecord): Promise<PayrollEmployeeRecord> {
  const raw = await apiFetch<Record<string, unknown>>('/api/payroll-employees', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  return mapPayrollEmployeeRecord(raw);
}

export async function updatePayrollEmployeeByCode(
  code: string,
  payload: PayrollEmployeeRecord,
): Promise<PayrollEmployeeRecord> {
  const raw = await apiFetch<Record<string, unknown>>(
    `/api/payroll-employees/by-code/${encodeURIComponent(code)}`,
    {
      method: 'PUT',
      body: JSON.stringify(payload),
    },
  );
  return mapPayrollEmployeeRecord(raw);
}

export async function deletePayrollEmployeeByCode(code: string): Promise<void> {
  await apiFetch(`/api/payroll-employees/by-code/${encodeURIComponent(code)}`, { method: 'DELETE' });
}

export function validatePayrollEmployeeForm(form: PayrollEmployeeRecord): string | null {
  if (!form.employeeCode.trim()) return 'Employee code is required.';
  if (!form.fullName.trim()) return 'Full name is required.';
  if (form.employeeType === 'permanent' || form.employeeType === 'temporary') {
    if ((form.monthlySalary ?? 0) <= 0) return 'Monthly salary is required.';
  }
  if (form.employeeType === 'temporary') {
    if (!form.contractStartDate) return 'Contract start date is required.';
    if (!form.contractEndDate) return 'Contract end date is required.';
    if (form.contractStartDate > form.contractEndDate) {
      return 'Contract end date must be on or after start date.';
    }
  }
  if (form.employeeType === 'daily' && (form.dailyWage ?? 0) <= 0) {
    return 'Daily wage rate is required.';
  }
  return null;
}
