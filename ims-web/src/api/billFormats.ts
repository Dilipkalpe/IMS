import type { BillFormatPrintSettings, BillFormatVisibilityRules, BillLayoutJson } from '../document/contracts/billLayout';
import { apiFetch, probeApiHealth } from './client';
import { invalidateSalesBillTemplateCache } from './salesBillTemplates';

export interface BillFormatTemplate {
  id: string;
  templateKey: string;
  formatCode: string;
  transactionType: string;
  name: string;
  description: string;
  appliesToDocTypes: string[];
  isSystem: boolean;
  isDefault: boolean;
  isActive: boolean;
  printSettings: BillFormatPrintSettings;
  visibilityRules: BillFormatVisibilityRules;
  layoutJson: BillLayoutJson;
  version: number;
}

export interface BillFormatCatalog {
  transactionTypes: Array<{ key: string; label: string }>;
  paperPresets: Array<{ key: string; label: string; widthMm: number; heightMm: number }>;
  fieldCatalog: Array<{ key: string; label: string; group: string }>;
}

export async function fetchBillFormatCatalog(): Promise<BillFormatCatalog | null> {
  try {
    if (!(await probeApiHealth())) return null;
    return await apiFetch<BillFormatCatalog>('/api/bill-formats/catalog');
  } catch {
    return null;
  }
}

export async function listBillFormats(params?: {
  transactionType?: string;
  includeInactive?: boolean;
}): Promise<BillFormatTemplate[]> {
  try {
    if (!(await probeApiHealth())) return [];
    const q = new URLSearchParams();
    if (params?.transactionType) q.set('transactionType', params.transactionType);
    if (params?.includeInactive) q.set('includeInactive', 'true');
    const qs = q.toString();
    return await apiFetch<BillFormatTemplate[]>(`/api/bill-formats${qs ? `?${qs}` : ''}`);
  } catch {
    return [];
  }
}

export async function getBillFormatById(id: string): Promise<BillFormatTemplate> {
  return apiFetch<BillFormatTemplate>(`/api/bill-formats/${encodeURIComponent(id)}`);
}

export async function updateBillFormat(
  id: string,
  patch: Partial<Pick<BillFormatTemplate, 'name' | 'description' | 'isDefault' | 'isActive' | 'printSettings'>>,
): Promise<BillFormatTemplate> {
  const result = await apiFetch<BillFormatTemplate>(`/api/bill-formats/${encodeURIComponent(id)}`, {
    method: 'PUT',
    body: JSON.stringify(patch),
  });
  invalidateSalesBillTemplateCache();
  return result;
}

export async function updateBillFormatLayout(
  id: string,
  layoutJson: BillLayoutJson,
): Promise<BillFormatTemplate> {
  const result = await apiFetch<BillFormatTemplate>(`/api/bill-formats/${encodeURIComponent(id)}/layout`, {
    method: 'PUT',
    body: JSON.stringify({ layoutJson }),
  });
  invalidateSalesBillTemplateCache();
  return result;
}

export async function createBillFormat(input: {
  name: string;
  transactionType: string;
  description?: string;
  appliesToDocTypes?: string[];
}): Promise<BillFormatTemplate> {
  const result = await apiFetch<BillFormatTemplate>('/api/bill-formats', {
    method: 'POST',
    body: JSON.stringify(input),
  });
  invalidateSalesBillTemplateCache();
  return result;
}

export async function duplicateBillFormat(id: string): Promise<BillFormatTemplate> {
  const result = await apiFetch<BillFormatTemplate>(`/api/bill-formats/${encodeURIComponent(id)}/duplicate`, {
    method: 'POST',
    body: JSON.stringify({}),
  });
  invalidateSalesBillTemplateCache();
  return result;
}

export async function deleteBillFormat(id: string): Promise<void> {
  await apiFetch<void>(`/api/bill-formats/${encodeURIComponent(id)}`, { method: 'DELETE' });
  invalidateSalesBillTemplateCache();
}

export async function exportBillFormatJson(id: string): Promise<unknown> {
  return apiFetch<unknown>(`/api/bill-formats/${encodeURIComponent(id)}/export`);
}
