import { apiFetch } from './client';

export interface ProductMainGroupRecord {
  code: string;
  name: string;
}

export interface ProductMainGroupListResult {
  items: ProductMainGroupRecord[];
  total: number;
  page: number;
  limit: number;
}

export async function fetchProductMainGroupNames(): Promise<string[]> {
  const result = await apiFetch<ProductMainGroupListResult>(
    '/api/product-main-groups?limit=500',
  );
  return result.items.map((g) => g.name.trim()).filter(Boolean);
}
