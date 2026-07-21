import { apiFetch } from './client';
import { openDeferredPrintWindow, openUrlPrintPreviewAsync } from '../utils/printPreview';

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

function buildPayslipHtmlUrl(input: {
  periodMonth: string;
  employeeCode: string;
  runNo?: number;
}): string {
  const params = new URLSearchParams({
    periodMonth: input.periodMonth,
    employeeCode: input.employeeCode,
  });
  if (input.runNo != null) params.set('runNo', String(input.runNo));
  const base = import.meta.env.VITE_API_BASE_URL?.replace(/\/$/, '') ?? '';
  return `${base}/api/payroll-reports/payslip-html?${params}`;
}

/** Load payslip HTML (with auth) and open print preview. */
export async function openPayslipHtmlPreview(input: {
  periodMonth: string;
  employeeCode: string;
  runNo?: number;
  targetWindow?: Window | null;
}): Promise<{ ok: boolean; message: string; window?: Window | null }> {
  const url = buildPayslipHtmlUrl(input);
  return openUrlPrintPreviewAsync(url, {
    targetWindow: input.targetWindow,
    title: `Payslip ${input.employeeCode}`,
  });
}

export { openDeferredPrintWindow };
