import { authHeaders } from './authToken';
import { getApiBaseUrl } from './config';

export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly body?: unknown,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  return apiFetchWithRetry(path, init);
}

async function apiFetchWithRetry<T>(
  path: string,
  init?: RequestInit,
  maxAttempts = 3,
): Promise<T> {
  const base = getApiBaseUrl();
  const url = path.startsWith('http') ? path : `${base}${path.startsWith('/') ? path : `/${path}`}`;
  let lastError: unknown;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const res = await fetch(url, {
        ...init,
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
          ...authHeaders(),
          ...init?.headers,
        },
      });
      if (!res.ok) {
        let body: unknown;
        try {
          body = await res.json();
        } catch {
          body = await res.text();
        }
        const msg =
          typeof body === 'object' && body && 'error' in body
            ? String((body as { error: string }).error)
            : res.statusText || `HTTP ${res.status}`;
        throw new ApiError(msg, res.status, body);
      }
      if (res.status === 204) return undefined as T;
      return res.json() as Promise<T>;
    } catch (err) {
      lastError = err;
      const isTransient =
        err instanceof TypeError ||
        (err instanceof ApiError && err.status >= 500);
      if (!isTransient || attempt >= maxAttempts) throw err;
      await new Promise((resolve) => setTimeout(resolve, 350 * attempt));
    }
  }

  throw lastError instanceof Error ? lastError : new Error('Request failed.');
}

export async function probeApiHealth(): Promise<boolean> {
  try {
    await apiFetch<{ ok?: boolean }>('/api/health', { method: 'GET' });
    return true;
  } catch {
    return false;
  }
}
