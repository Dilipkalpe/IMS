import { apiFetch } from './client';
import type { FinancialYearOption } from './auth';

export async function fetchFinancialYearsList(): Promise<FinancialYearOption[]> {
  const years = await apiFetch<FinancialYearOption[]>('/api/financial-years');
  return Array.isArray(years) ? years : [];
}

export interface YearEndInput {
  fromYearId: string;
  toFinancialYearName: string;
  toStartDate: string;
  toEndDate: string;
}

export async function runFinancialYearEnd(input: YearEndInput): Promise<{ ok: boolean; toYearId?: string }> {
  return apiFetch('/api/financial-years/year-end', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export async function deleteFinancialYear(id: string): Promise<void> {
  await apiFetch(`/api/financial-years/${encodeURIComponent(id)}`, { method: 'DELETE' });
}
