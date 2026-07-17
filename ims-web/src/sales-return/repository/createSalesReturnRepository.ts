import { probeApiHealth } from '../../api/client';
import { HttpSalesReturnRepository } from './httpSalesReturnRepository';
import { LocalSalesReturnRepository } from './localSalesReturnRepository';
import type { SalesReturnRepository } from './types';

let cached: SalesReturnRepository | null = null;
let cachedIsHttp = false;
let resolvePromise: Promise<SalesReturnRepository> | null = null;

export async function resolveSalesReturnRepository(preferHttp = true): Promise<SalesReturnRepository> {
  if (cached && cachedIsHttp) return cached;
  if (resolvePromise) return resolvePromise;

  resolvePromise = (async () => {
    try {
      if (preferHttp && (await probeApiHealth())) {
        cached = new HttpSalesReturnRepository();
        cachedIsHttp = true;
        return cached;
      }
      if (!cached) {
        cached = new LocalSalesReturnRepository();
        cachedIsHttp = false;
      }
      return cached;
    } finally {
      resolvePromise = null;
    }
  })();

  return resolvePromise;
}
