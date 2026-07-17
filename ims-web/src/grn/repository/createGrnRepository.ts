import { probeApiHealth } from '../../api/client';
import { HttpGrnRepository } from './httpGrnRepository';
import { LocalGrnRepository } from './localGrnRepository';
import type { GrnRepository } from './types';

let cached: GrnRepository | null = null;
let cachedIsHttp = false;
let resolvePromise: Promise<GrnRepository> | null = null;

export async function resolveGrnRepository(preferHttp = true): Promise<GrnRepository> {
  if (cached && cachedIsHttp) return cached;
  if (resolvePromise) return resolvePromise;

  resolvePromise = (async () => {
    try {
      if (preferHttp && (await probeApiHealth())) {
        cached = new HttpGrnRepository();
        cachedIsHttp = true;
        return cached;
      }
      if (!cached) {
        cached = new LocalGrnRepository();
        cachedIsHttp = false;
      }
      return cached;
    } finally {
      resolvePromise = null;
    }
  })();

  return resolvePromise;
}
