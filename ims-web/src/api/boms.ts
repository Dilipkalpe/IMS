import { apiFetch } from './client';

export interface BomLine {
  srNo: number;
  productCode?: string;
  productName?: string;
  qty?: number;
  unit?: string;
  rate?: number;
  amount?: number;
}

export interface BomRecord {
  productCode: string;
  productId?: string;
  productName?: string;
  revision?: string;
  standardQty?: number;
  rawMaterials?: BomLine[];
  consumables?: BomLine[];
  rawMaterialAmount?: number;
  productionAmount?: number;
  status?: string;
}

export interface BomPagedResult {
  items: BomRecord[];
  total: number;
  page: number;
  limit: number;
}

export async function fetchBomsPage(params?: {
  page?: number;
  limit?: number;
  search?: string;
}): Promise<BomPagedResult> {
  const q = new URLSearchParams();
  if (params?.page != null) q.set('page', String(params.page));
  if (params?.limit != null) q.set('limit', String(params.limit));
  if (params?.search?.trim()) q.set('search', params.search.trim());
  const qs = q.toString();
  return apiFetch<BomPagedResult>(`/api/boms${qs ? `?${qs}` : ''}`);
}

export async function fetchBomByProduct(productCode: string): Promise<BomRecord | null> {
  try {
    return await apiFetch<BomRecord>(`/api/boms/by-product/${encodeURIComponent(productCode.trim())}`);
  } catch {
    return null;
  }
}

export async function saveBom(payload: BomRecord): Promise<BomRecord> {
  const code = payload.productCode.trim();
  if (!code) throw new Error('Product code is required.');
  return apiFetch<BomRecord>(`/api/boms/by-product/${encodeURIComponent(code)}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
}

export async function createBom(payload: BomRecord): Promise<BomRecord> {
  return apiFetch<BomRecord>('/api/boms', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}
