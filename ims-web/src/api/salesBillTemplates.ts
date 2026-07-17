import type { BillFormatPrintSettings, BillFormatVisibilityRules, BillLayoutJson } from '../document/contracts/billLayout';
import type { DocumentTypeKey } from '../document/contracts/documentTypes';
import { apiFetch, probeApiHealth } from './client';

export interface SalesBillTemplateDto {
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

export interface BillFormatResolveResult {
  source: 'party_assignment' | 'default' | 'none';
  docTypeKey: string;
  partyCode: string | null;
  template: SalesBillTemplateDto | null;
}

const CACHE_TTL_MS = 2 * 60_000;
const cache = new Map<string, { template: SalesBillTemplateDto; loadedAt: number }>();

function cacheKey(docTypeKey: string, partyCode?: string) {
  return `${docTypeKey}:${partyCode?.trim().toUpperCase() ?? ''}`;
}

export function invalidateSalesBillTemplateCache(): void {
  cache.clear();
}

/** WPF: ImsApiClient.GetDefaultSalesBillTemplateAsync */
export async function fetchDefaultSalesBillTemplate(
  docTypeKey: DocumentTypeKey | string,
): Promise<SalesBillTemplateDto | null> {
  const key = String(docTypeKey).trim().toLowerCase();
  const cached = cache.get(`default:${key}`);
  if (cached && Date.now() - cached.loadedAt < CACHE_TTL_MS) {
    return cached.template;
  }

  try {
    if (!(await probeApiHealth())) return null;
    const template = await apiFetch<SalesBillTemplateDto>(
      `/api/sales-bill-templates/default?docTypeKey=${encodeURIComponent(key)}`,
    );
    cache.set(`default:${key}`, { template, loadedAt: Date.now() });
    return template;
  } catch {
    return null;
  }
}

/** WPF: BillFormatPrintResolver — party assignment then default. */
export async function resolveSalesBillTemplate(params: {
  docTypeKey: DocumentTypeKey | string;
  partyCode?: string;
  accountType?: string;
}): Promise<BillFormatResolveResult | null> {
  const docKey = String(params.docTypeKey).trim().toLowerCase();
  const ck = cacheKey(docKey, params.partyCode);
  const cached = cache.get(ck);
  if (cached && Date.now() - cached.loadedAt < CACHE_TTL_MS) {
    return {
      source: 'default',
      docTypeKey: docKey,
      partyCode: params.partyCode?.trim().toUpperCase() ?? null,
      template: cached.template,
    };
  }

  try {
    if (!(await probeApiHealth())) return null;
    const qs = new URLSearchParams({ docTypeKey: docKey });
    if (params.partyCode?.trim()) qs.set('partyCode', params.partyCode.trim());
    if (params.accountType?.trim()) qs.set('accountType', params.accountType.trim());
    const result = await apiFetch<BillFormatResolveResult>(`/api/bill-formats/resolve?${qs.toString()}`);
    if (result.template) {
      cache.set(ck, { template: result.template, loadedAt: Date.now() });
    }
    return result;
  } catch {
    return null;
  }
}

export async function listSalesBillTemplates(): Promise<SalesBillTemplateDto[]> {
  try {
    if (!(await probeApiHealth())) return [];
    return await apiFetch<SalesBillTemplateDto[]>('/api/sales-bill-templates');
  } catch {
    return [];
  }
}
