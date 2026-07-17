/** WPF-aligned product info for sales line entry (SalesProductLookup.SalesProductInfo). */
export interface SalesProductInfo {
  code: string;
  name: string;
  rate: number;
  taxType: string;
  taxPercent: string;
  purchasePrice?: number;
  stockQty?: number;
}

/** WPF SalesProductLookup.FallbackCatalog — used when API is offline or lookup misses. */
export const OFFLINE_PRODUCT_CATALOG: readonly SalesProductInfo[] = [
  { code: '10001', name: 'Sample Product A', rate: 150, taxType: 'GST', taxPercent: '18' },
  { code: '10002', name: 'Sample Product B', rate: 320, taxType: 'GST', taxPercent: '18' },
  { code: '10003', name: 'Industrial Pump FG-5001', rate: 2450, taxType: 'GST', taxPercent: '18' },
  { code: 'RM-1001', name: 'Steel Sheet 2mm', rate: 85, taxType: 'GST', taxPercent: '18' },
  { code: 'PEN', name: 'Ball Pen Blue', rate: 12.5, taxType: 'GST', taxPercent: '18' },
];

export function findLocalProduct(term: string): SalesProductInfo | null {
  const q = term.trim();
  if (!q) return null;

  const exact = OFFLINE_PRODUCT_CATALOG.find(
    (p) => p.code.localeCompare(q, undefined, { sensitivity: 'accent' }) === 0,
  );
  if (exact) return exact;

  const lower = q.toLowerCase();
  return OFFLINE_PRODUCT_CATALOG.find((p) => p.name.toLowerCase().includes(lower)) ?? null;
}

export function searchLocalProducts(term: string, limit = 40): SalesProductInfo[] {
  const q = term.trim().toLowerCase();
  if (!q) return [...OFFLINE_PRODUCT_CATALOG].slice(0, limit);

  return OFFLINE_PRODUCT_CATALOG.filter(
    (p) => p.code.toLowerCase().includes(q) || p.name.toLowerCase().includes(q),
  ).slice(0, limit);
}
