import { probeApiHealth } from '../../api/client';
import { HttpQuotationRepository } from './httpQuotationRepository';
import { LocalQuotationRepository } from './localQuotationRepository';
import type { QuotationRepository } from './types';

let cached: QuotationRepository | null = null;
let cachedIsHttp = false;
let resolvePromise: Promise<QuotationRepository> | null = null;

export async function resolveQuotationRepository(preferHttp = true): Promise<QuotationRepository> {
  if (cached && cachedIsHttp) return cached;
  if (resolvePromise) return resolvePromise;

  resolvePromise = (async () => {
    try {
      if (preferHttp && (await probeApiHealth())) {
        cached = new HttpQuotationRepository();
        cachedIsHttp = true;
        return cached;
      }
      if (!cached) {
        cached = new LocalQuotationRepository();
        cachedIsHttp = false;
      }
      return cached;
    } finally {
      resolvePromise = null;
    }
  })();

  return resolvePromise;
}
