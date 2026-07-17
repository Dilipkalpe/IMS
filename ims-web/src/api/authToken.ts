const SESSION_KEY = 'ims.authSession';

interface StoredAuthSession {
  token?: string;
}

/** Reads Bearer token from localStorage session (when login flow stores it). */
export function getAuthBearerToken(): string | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const session = JSON.parse(raw) as StoredAuthSession;
    const token = session.token?.trim();
    return token || null;
  } catch {
    return null;
  }
}

export function authHeaders(): Record<string, string> {
  const token = getAuthBearerToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}
