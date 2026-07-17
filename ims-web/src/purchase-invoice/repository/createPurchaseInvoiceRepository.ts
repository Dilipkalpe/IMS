import { probeApiHealth } from '../../api/client';
import { HttpPurchaseInvoiceRepository } from './httpPurchaseInvoiceRepository';
import { LocalPurchaseInvoiceRepository } from './localPurchaseInvoiceRepository';
import type { PurchaseInvoiceRepository } from './types';

let cached: PurchaseInvoiceRepository | null = null;
let cachedIsHttp = false;
let resolvePromise: Promise<PurchaseInvoiceRepository> | null = null;

export async function resolvePurchaseInvoiceRepository(
  preferHttp = true,
): Promise<PurchaseInvoiceRepository> {
  if (cached && cachedIsHttp) return cached;
  if (resolvePromise) return resolvePromise;

  resolvePromise = (async () => {
    try {
      if (preferHttp && (await probeApiHealth())) {
        cached = new HttpPurchaseInvoiceRepository();
        cachedIsHttp = true;
        return cached;
      }
      if (!cached) {
        cached = new LocalPurchaseInvoiceRepository();
        cachedIsHttp = false;
      }
      return cached;
    } finally {
      resolvePromise = null;
    }
  })();

  return resolvePromise;
}

export function resetPurchaseInvoiceRepositoryForTests(): void {
  cached = null;
  cachedIsHttp = false;
  resolvePromise = null;
}
