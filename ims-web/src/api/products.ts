import { apiFetch, probeApiHealth } from './client';
import {
  findLocalProduct,
  searchLocalProducts,
  type SalesProductInfo,
} from '../components/transaction/salesProductPicker';

export type { SalesProductInfo };

export interface ProductSearchResult {
  items: SalesProductInfo[];
  total: number;
  page?: number;
  limit?: number;
}

interface ProductRecord {
  code: string;
  name: string;
  salePrice?: number;
  purchasePrice?: number;
  stockQty?: number;
  taxType?: string;
  taxPercent?: string | number;
  cgst?: number;
  sgst?: number;
  igst?: number;
}

function resolveTaxPercentFromRecord(product: ProductRecord): string {
  if (product.taxPercent != null && product.taxPercent !== '') {
    return String(product.taxPercent);
  }
  const fromGst =
    (product.igst ?? 0) > 0 ? product.igst! : (product.cgst ?? 0) + (product.sgst ?? 0);
  return String(fromGst > 0 ? fromGst : 18);
}

export function productRecordToInfo(product: ProductRecord): SalesProductInfo {
  return {
    code: product.code,
    name: product.name,
    rate: product.salePrice ?? 0,
    purchasePrice: product.purchasePrice ?? 0,
    stockQty: product.stockQty ?? 0,
    taxType: product.taxType || 'GST',
    taxPercent: resolveTaxPercentFromRecord(product),
  };
}

/** WPF: ImsApiClient.LookupProductAsync → GET /api/products/lookup?q= */
export async function lookupProduct(term: string): Promise<SalesProductInfo | null> {
  const q = term.trim();
  if (!q) return null;

  try {
    const apiUp = await probeApiHealth();
    if (apiUp) {
      const hit = await apiFetch<SalesProductInfo | null>(
        `/api/products/lookup?q=${encodeURIComponent(q)}`,
      );
      if (hit) return hit;
    }
  } catch {
    // fall through to local catalog
  }

  return findLocalProduct(q);
}

/** WPF: ImsApiClient.SearchProductsAsync → GET /api/products/search?q= */
export async function searchProducts(term: string, limit = 40): Promise<ProductSearchResult> {
  const q = term.trim();
  if (q.length < 2) {
    return { items: [], total: 0 };
  }

  try {
    const apiUp = await probeApiHealth();
    if (apiUp) {
      const result = await apiFetch<{ items: SalesProductInfo[]; total: number }>(
        `/api/products/search?q=${encodeURIComponent(q)}&limit=${limit}`,
      );
      return {
        items: Array.isArray(result.items) ? result.items : [],
        total: result.total ?? 0,
      };
    }
  } catch {
    // fall through
  }

  const items = searchLocalProducts(q, limit);
  return { items, total: items.length };
}

/** WPF ProductBrowseViewModel page load → GET /api/products?page=&limit=&search= */
export async function fetchProductsPage(params?: {
  search?: string;
  page?: number;
  limit?: number;
}): Promise<ProductSearchResult> {
  const page = params?.page ?? 1;
  const limit = params?.limit ?? 25;
  const search = params?.search?.trim() ?? '';

  try {
    const apiUp = await probeApiHealth();
    if (apiUp) {
      const q = new URLSearchParams();
      q.set('page', String(page));
      q.set('limit', String(limit));
      if (search) q.set('search', search);

      const result = await apiFetch<{
        items: ProductRecord[];
        total: number;
        page: number;
        limit: number;
      }>(`/api/products?${q.toString()}`);

      return {
        items: (result.items ?? []).map(productRecordToInfo),
        total: result.total ?? 0,
        page: result.page,
        limit: result.limit,
      };
    }
  } catch {
    // fall through
  }

  const items = search ? searchLocalProducts(search, limit) : [...searchLocalProducts('', limit)];
  return { items, total: items.length, page, limit };
}

/** Full product record for master CRUD. */
export interface ProductMasterRecord {
  _id?: string;
  code: string;
  name: string;
  category?: string;
  unit?: string;
  size?: string;
  length?: string;
  brand?: string;
  hsnCode?: string;
  salePrice?: number;
  purchasePrice?: number;
  reorderQty?: number;
  minOrderQty?: number;
  cgst?: number;
  sgst?: number;
  igst?: number;
  productType?: string;
  productMainGroup?: string;
  productSubGroup?: string;
  assemblyType?: string;
  saleUom?: string;
  purchaseUom?: string;
  serialApplicable?: boolean;
  gstExempt?: boolean;
  activeStatus?: boolean;
  taxType?: string;
  taxPercent?: string;
  stockQty?: number;
}

export interface ProductMasterListResult {
  items: ProductMasterRecord[];
  total: number;
  page: number;
  limit: number;
}

export async function fetchProductMasterPage(params?: {
  search?: string;
  page?: number;
  limit?: number;
}): Promise<ProductMasterListResult> {
  const q = new URLSearchParams();
  if (params?.page != null) q.set('page', String(params.page));
  if (params?.limit != null) q.set('limit', String(params.limit));
  if (params?.search?.trim()) q.set('search', params.search.trim());
  const qs = q.toString();
  return apiFetch<ProductMasterListResult>(`/api/products${qs ? `?${qs}` : ''}`);
}

export async function getProductByCode(code: string): Promise<ProductMasterRecord> {
  return apiFetch<ProductMasterRecord>(`/api/products/by-code/${encodeURIComponent(code.trim())}`);
}

export async function createProduct(input: ProductMasterRecord): Promise<ProductMasterRecord> {
  return apiFetch<ProductMasterRecord>('/api/products', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export async function updateProductByCode(
  code: string,
  input: Partial<ProductMasterRecord>,
): Promise<ProductMasterRecord> {
  return apiFetch<ProductMasterRecord>(`/api/products/by-code/${encodeURIComponent(code.trim())}`, {
    method: 'PUT',
    body: JSON.stringify(input),
  });
}

export async function deleteProductByCode(code: string): Promise<void> {
  await apiFetch<{ ok: boolean }>(`/api/products/by-code/${encodeURIComponent(code.trim())}`, {
    method: 'DELETE',
  });
}
