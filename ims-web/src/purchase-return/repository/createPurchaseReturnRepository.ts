import { probeApiHealth } from '../../api/client';
import { HttpPurchaseReturnRepository } from './httpPurchaseReturnRepository';
import { LocalPurchaseReturnRepository } from './localPurchaseReturnRepository';
import type { PurchaseReturnRepository } from './types';

let cached: PurchaseReturnRepository | null = null;
let cachedIsHttp = false;
let resolvePromise: Promise<PurchaseReturnRepository> | null = null;

export async function resolvePurchaseReturnRepository(preferHttp = true): Promise<PurchaseReturnRepository> {
  if (cached && cachedIsHttp) return cached;
  if (resolvePromise) return resolvePromise;

  resolvePromise = (async () => {
    try {
      if (preferHttp && (await probeApiHealth())) {
        cached = new HttpPurchaseReturnRepository();
        cachedIsHttp = true;
        return cached;
      }
      if (!cached) {
        cached = new LocalPurchaseReturnRepository();
        cachedIsHttp = false;
      }
      return cached;
    } finally {
      resolvePromise = null;
    }
  })();

  return resolvePromise;
}
