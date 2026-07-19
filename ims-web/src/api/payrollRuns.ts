import { apiFetch } from './client';

export interface PayrollRunLine {
  employeeCode: string;
  employeeName?: string;
  netPay?: number;
  earnings?: { gross?: number };
  deductions?: { total?: number; tds?: number };
}

export interface PayrollRunRecord {
  runNo: number;
  periodMonth: string;
  periodFrom?: string;
  periodTo?: string;
  employeeCount?: number;
  totalGross?: number;
  totalDeductions?: number;
  totalNet?: number;
  status?: string;
  processedAt?: string;
  processedBy?: string;
  remark?: string;
  lines?: PayrollRunLine[];
}

export interface PayrollRunPagedResult {
  items: PayrollRunRecord[];
  total: number;
  page: number;
  limit: number;
}

export async function fetchPayrollRunsPage(params?: {
  page?: number;
  limit?: number;
  periodMonth?: string;
  status?: string;
}): Promise<PayrollRunPagedResult> {
  const q = new URLSearchParams();
  if (params?.page != null) q.set('page', String(params.page));
  if (params?.limit != null) q.set('limit', String(params.limit));
  if (params?.periodMonth) q.set('periodMonth', params.periodMonth);
  if (params?.status) q.set('status', params.status);
  const qs = q.toString();
  return apiFetch<PayrollRunPagedResult>(`/api/payroll-runs${qs ? `?${qs}` : ''}`);
}

export async function fetchPayrollRunByNo(runNo: number): Promise<PayrollRunRecord> {
  return apiFetch<PayrollRunRecord>(`/api/payroll-runs/by-no/${runNo}`);
}

export async function processPayrollRun(body: {
  periodMonth: string;
  bonusPercent?: number;
  remark?: string;
  reprocess?: boolean;
}): Promise<PayrollRunRecord> {
  return apiFetch<PayrollRunRecord>('/api/payroll-runs/process', {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

export async function postPayrollRunPayment(
  runNo: number,
  body?: { paymentDate?: string; cashBank?: string; remark?: string },
): Promise<unknown> {
  return apiFetch(`/api/payroll-runs/by-no/${runNo}/post-payment`, {
    method: 'POST',
    body: JSON.stringify(body ?? {}),
  });
}
