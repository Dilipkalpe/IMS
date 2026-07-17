import { useCallback, useState } from 'react';
import { probeApiHealth } from '../api/client';
import { getApiBaseUrl } from '../api/config';
import { SettingsFormRow, SettingsPanel } from './SettingsPanel';

function resolveWebAppUrl(): string {
  if (typeof window === 'undefined') return '';
  const origin = window.location.origin;
  const path = window.location.pathname.replace(/\/[^/]*$/, '');
  const base = path.endsWith('/IMSWebApp') ? path : `${path}/IMSWebApp`.replace(/\/+/g, '/');
  if (import.meta.env.DEV) return `${origin}/`;
  return `${origin}${base.endsWith('/') ? base : `${base}/`}`;
}

export function ApiConnectionPanel() {
  const apiUrl = getApiBaseUrl() || `${typeof window !== 'undefined' ? window.location.origin : ''}/api (proxy)`;
  const webAppUrl = resolveWebAppUrl();
  const [status, setStatus] = useState('Test the API connection to verify the server is reachable.');
  const [busy, setBusy] = useState(false);

  const testConnection = useCallback(async () => {
    setBusy(true);
    setStatus('Testing connection…');
    try {
      const ok = await probeApiHealth();
      setStatus(ok ? 'Connection successful — API is online.' : 'API health check failed.');
    } catch (err) {
      setStatus(err instanceof Error ? err.message : 'Connection failed.');
    } finally {
      setBusy(false);
    }
  }, []);

  const openWebApp = useCallback(() => {
    if (webAppUrl) window.open(webAppUrl, '_blank', 'noopener,noreferrer');
  }, [webAppUrl]);

  return (
    <SettingsPanel
      title="API & web connection"
      description="The web application uses the API base URL from your deployment configuration (Vite env or IIS). Use Test connection to verify the API is running."
    >
      <SettingsFormRow label="Resolved API URL">
        <input type="text" className="settings-input settings-input--readonly" readOnly value={apiUrl} />
      </SettingsFormRow>

      <SettingsFormRow label="Web app URL">
        <div className="settings-inline-actions">
          <input type="text" className="settings-input settings-input--readonly" readOnly value={webAppUrl} />
          <button type="button" className="settings-btn settings-btn--secondary" onClick={openWebApp}>
            Open web app
          </button>
        </div>
      </SettingsFormRow>

      <div className="settings-actions">
        <button type="button" className="settings-btn settings-btn--primary" disabled={busy} onClick={() => void testConnection()}>
          {busy ? 'Testing…' : 'Test connection'}
        </button>
      </div>

      <p className="settings-panel__status" role="status">
        {status}
      </p>
    </SettingsPanel>
  );
}
