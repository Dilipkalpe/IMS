import { probeApiHealth } from '../../api/client';
import { HttpSalesInvoiceRepository } from './httpSalesInvoiceRepository';
import { LocalSalesInvoiceRepository } from './localSalesInvoiceRepository';
import type { SalesInvoiceRepository } from './types';

let cached: SalesInvoiceRepository | null = null;
let cachedIsHttp = false;
let resolvePromise: Promise<SalesInvoiceRepository> | null = null;

export async function resolveSalesInvoiceRepository(
  preferHttp = true,
): Promise<SalesInvoiceRepository> {
  if (cached && cachedIsHttp) return cached;
  if (resolvePromise) return resolvePromise;

  resolvePromise = (async () => {
    try {
      if (preferHttp && (await probeApiHealth())) {
        cached = new HttpSalesInvoiceRepository();
        cachedIsHttp = true;
        return cached;
      }
      if (!cached) {
        cached = new LocalSalesInvoiceRepository();
        cachedIsHttp = false;
      }
      return cached;
    } finally {
      resolvePromise = null;
    }
  })();

  return resolvePromise;
}

export function getSalesInvoiceRepositorySync(): SalesInvoiceRepository | null {
  return cached;
}

export function resetSalesInvoiceRepositoryForTests(): void {
  cached = null;
  cachedIsHttp = false;
  resolvePromise = null;
}
