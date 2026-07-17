import { probeApiHealth } from '../../api/client';
import { HttpDeliveryChallanRepository } from './httpDeliveryChallanRepository';
import { LocalDeliveryChallanRepository } from './localDeliveryChallanRepository';
import type { DeliveryChallanRepository } from './types';

let cached: DeliveryChallanRepository | null = null;
let cachedIsHttp = false;
let resolvePromise: Promise<DeliveryChallanRepository> | null = null;

export async function resolveDeliveryChallanRepository(preferHttp = true): Promise<DeliveryChallanRepository> {
  if (cached && cachedIsHttp) return cached;
  if (resolvePromise) return resolvePromise;

  resolvePromise = (async () => {
    try {
      if (preferHttp && (await probeApiHealth())) {
        cached = new HttpDeliveryChallanRepository();
        cachedIsHttp = true;
        return cached;
      }
      if (!cached) {
        cached = new LocalDeliveryChallanRepository();
        cachedIsHttp = false;
      }
      return cached;
    } finally {
      resolvePromise = null;
    }
  })();

  return resolvePromise;
}
