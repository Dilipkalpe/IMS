import { apiFetch } from './client';

export interface PayslipReport {
  runNo?: number;
  periodMonth?: string;
  companyNote?: string;
  payslip?: Record<string, unknown>;
}

export async function fetchPayslipByPeriod(input: {
  periodMonth: string;
  employeeCode: string;
  runNo?: number;
}): Promise<PayslipReport> {
  const params = new URLSearchParams({
    periodMonth: input.periodMonth,
    employeeCode: input.employeeCode,
  });
  if (input.runNo != null) params.set('runNo', String(input.runNo));
  return apiFetch<PayslipReport>(`/api/payroll-reports/payslip-by-period?${params}`);
}

export function openPayslipHtmlPreview(input: {
  periodMonth: string;
  employeeCode: string;
  runNo?: number;
}): Window | null {
  const params = new URLSearchParams({
    periodMonth: input.periodMonth,
    employeeCode: input.employeeCode,
  });
  if (input.runNo != null) params.set('runNo', String(input.runNo));
  const base = import.meta.env.VITE_API_BASE_URL?.replace(/\/$/, '') ?? '';
  const url = `${base}/api/payroll-reports/payslip-html?${params}`;
  return window.open(url, '_blank', 'noopener,noreferrer,width=900,height=700');
}
