import { probeApiHealth } from '../../api/client';
import { HttpPurchaseOrderRepository } from './httpPurchaseOrderRepository';
import { LocalPurchaseOrderRepository } from './localPurchaseOrderRepository';
import type { PurchaseOrderRepository } from './types';

let cached: PurchaseOrderRepository | null = null;
let cachedIsHttp = false;
let resolvePromise: Promise<PurchaseOrderRepository> | null = null;

export async function resolvePurchaseOrderRepository(preferHttp = true): Promise<PurchaseOrderRepository> {
  if (cached && cachedIsHttp) return cached;
  if (resolvePromise) return resolvePromise;

  resolvePromise = (async () => {
    try {
      if (preferHttp && (await probeApiHealth())) {
        cached = new HttpPurchaseOrderRepository();
        cachedIsHttp = true;
        return cached;
      }
      if (!cached) {
        cached = new LocalPurchaseOrderRepository();
        cachedIsHttp = false;
      }
      return cached;
    } finally {
      resolvePromise = null;
    }
  })();

  return resolvePromise;
}
