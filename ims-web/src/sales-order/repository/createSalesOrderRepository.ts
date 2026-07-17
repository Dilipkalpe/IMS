import { probeApiHealth } from '../../api/client';
import { HttpSalesOrderRepository } from './httpSalesOrderRepository';
import { LocalSalesOrderRepository } from './localSalesOrderRepository';
import type { SalesOrderRepository } from './types';

let cached: SalesOrderRepository | null = null;
let cachedIsHttp = false;
let resolvePromise: Promise<SalesOrderRepository> | null = null;

export async function resolveSalesOrderRepository(preferHttp = true): Promise<SalesOrderRepository> {
  if (cached && cachedIsHttp) return cached;
  if (resolvePromise) return resolvePromise;

  resolvePromise = (async () => {
    try {
      if (preferHttp && (await probeApiHealth())) {
        cached = new HttpSalesOrderRepository();
        cachedIsHttp = true;
        return cached;
      }
      if (!cached) {
        cached = new LocalSalesOrderRepository();
        cachedIsHttp = false;
      }
      return cached;
    } finally {
      resolvePromise = null;
    }
  })();

  return resolvePromise;
}
