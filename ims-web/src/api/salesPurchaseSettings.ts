import { apiFetch, probeApiHealth } from './client';

export type SalesRateSource = 'product_master' | 'purchase_invoice';

export interface SalesPurchaseSettings {
  salesRateSource: SalesRateSource;
}

const STORAGE_KEY = 'ims.salesPurchaseSettings';

let cached: SalesPurchaseSettings | null = null;

function normalizeSource(value: unknown): SalesRateSource {
  return String(value ?? '').trim().toLowerCase() === 'purchase_invoice'
    ? 'purchase_invoice'
    : 'product_master';
}

function readLocalSettings(): SalesPurchaseSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as { salesRateSource?: unknown };
      return { salesRateSource: normalizeSource(parsed.salesRateSource) };
    }
  } catch {
    // ignore
  }
  return { salesRateSource: 'product_master' };
}

function persistLocal(settings: SalesPurchaseSettings): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  } catch {
    // ignore
  }
}

/** WPF: SalesPurchaseSettingsService.SyncFromApiAsync → GET /api/settings/sales-purchase */
export async function getSalesPurchaseSettings(): Promise<SalesPurchaseSettings> {
  if (cached) return cached;

  try {
    const apiUp = await probeApiHealth();
    if (apiUp) {
      const dto = await apiFetch<SalesPurchaseSettings>('/api/settings/sales-purchase');
      cached = { salesRateSource: normalizeSource(dto.salesRateSource) };
      persistLocal(cached);
      return cached;
    }
  } catch {
    // fall through to local cache
  }

  cached = readLocalSettings();
  return cached;
}

export function clearSalesPurchaseSettingsCache(): void {
  cached = null;
}

/** WPF: SalesPurchaseSettingsService.SaveToApiAsync → PUT /api/settings/sales-purchase */
export async function updateSalesPurchaseSettings(
  settings: SalesPurchaseSettings,
): Promise<SalesPurchaseSettings> {
  const normalized = { salesRateSource: normalizeSource(settings.salesRateSource) };
  const dto = await apiFetch<SalesPurchaseSettings>('/api/settings/sales-purchase', {
    method: 'PUT',
    body: JSON.stringify(normalized),
  });
  cached = { salesRateSource: normalizeSource(dto.salesRateSource) };
  persistLocal(cached);
  return cached;
}
