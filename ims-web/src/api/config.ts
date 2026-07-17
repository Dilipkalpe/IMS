/** API base URL — override with VITE_API_BASE_URL in .env.production */
export function getApiBaseUrl(): string {
  const fromEnv = import.meta.env.VITE_API_BASE_URL as string | undefined;
  if (fromEnv?.trim()) return fromEnv.replace(/\/$/, '');

  // Dev: relative URLs hit Vite proxy (vite.config.ts → :3000).
  if (import.meta.env.DEV) return '';

  const basePath = String(import.meta.env.BASE_URL || '/').replace(/\/$/, '');

  // Linux/nginx (Contabo): app at site root, API proxied as /api on same host.
  if (!basePath || basePath === '/') return '';

  // IIS production: API application IMSWebAPI on same host as IMSWebApp.
  if (typeof window !== 'undefined' && window.location?.origin) {
    return `${window.location.origin}/IMSWebAPI`;
  }

  return 'http://localhost/IMSWebAPI';
}
