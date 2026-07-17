import { lookupProduct } from '../../api/products';
import type { SalesProductInfo } from './salesProductPicker';

export function toPurchaseProductInfo(product: SalesProductInfo): SalesProductInfo {
  const purchaseRate = product.purchasePrice ?? 0;
  const rate = purchaseRate > 0 ? purchaseRate : product.rate;
  return { ...product, rate };
}

export async function lookupPurchaseProduct(term: string): Promise<SalesProductInfo | null> {
  const hit = await lookupProduct(term);
  return hit ? toPurchaseProductInfo(hit) : null;
}

export function formatBalStk(value: number | undefined | null): string {
  if (value == null || !Number.isFinite(value)) return '';
  return value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
