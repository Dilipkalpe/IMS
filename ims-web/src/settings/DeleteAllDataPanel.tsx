import { useCallback, useEffect, useState } from 'react';
import { fetchDataSummary, purgeAllData, PURGE_CONFIRM_PHRASE, type DataSummary } from '../api/admin';
import { probeApiHealth } from '../api/client';
import { SettingsPanel } from './SettingsPanel';

function formatSummary(summary: DataSummary | null): string {
  if (!summary) return 'Connect to the API and click Refresh counts to load record totals.';
  const lines = [`Total records: ${summary.totalRecords.toLocaleString()}`];
  const entries = Object.values(summary.collections ?? {}).filter((c) => c.count > 0);
  if (entries.length) {
    lines.push('');
    entries.slice(0, 12).forEach((c) => lines.push(`${c.label}: ${c.count.toLocaleString()}`));
    if (entries.length > 12) lines.push(`… and ${entries.length - 12} more collections`);
  }
  return lines.join('\n');
}

export function DeleteAllDataPanel() {
  const [summary, setSummary] = useState<DataSummary | null>(null);
  const [summaryText, setSummaryText] = useState(formatSummary(null));
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState('');
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmPhrase, setConfirmPhrase] = useState('');

  const refresh = useCallback(async () => {
    setBusy(true);
    setStatus('');
    try {
      const apiUp = await probeApiHealth();
      if (!apiUp) {
        setSummary(null);
        setSummaryText('API is offline. Start the API to view record counts.');
        return;
      }
      const data = await fetchDataSummary();
      setSummary(data);
      setSummaryText(formatSummary(data));
    } catch (err) {
      setSummary(null);
      setSummaryText(err instanceof Error ? err.message : 'Could not load data summary.');
    } finally {
      setBusy(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const purge = useCallback(async () => {
    if (confirmPhrase.trim() !== PURGE_CONFIRM_PHRASE) {
      setStatus(`Type exactly: ${PURGE_CONFIRM_PHRASE}`);
      return;
    }
    setBusy(true);
    setStatus('');
    try {
      const result = await purgeAllData(confirmPhrase.trim());
      setStatus(result.message ?? 'All data deleted.');
      setConfirmOpen(false);
      setConfirmPhrase('');
      await refresh();
    } catch (err) {
      setStatus(err instanceof Error ? err.message : 'Purge failed.');
    } finally {
      setBusy(false);
    }
  }, [confirmPhrase, refresh]);

  return (
    <SettingsPanel
      title="Delete all data"
      description="Permanently remove all business data from the database. This cannot be undone."
      danger
    >
      <pre className="settings-summary-pre">{summaryText}</pre>

      <div className="settings-actions">
        <button type="button" className="settings-btn settings-btn--secondary" disabled={busy} onClick={() => void refresh()}>
          Refresh counts
        </button>
        <button
          type="button"
          className="settings-btn settings-btn--danger"
          disabled={busy}
          onClick={() => setConfirmOpen(true)}
        >
          Delete all database data…
        </button>
      </div>

      {confirmOpen ? (
        <div className="settings-confirm-box">
          <p className="settings-confirm-box__warning">
            This will delete all IMS data{summary ? ` (${summary.totalRecords.toLocaleString()} records)` : ''}. Type the
            confirmation phrase below.
          </p>
          <label className="settings-form-row__label" htmlFor="purge-confirm">
            Confirmation phrase
          </label>
          <input
            id="purge-confirm"
            type="text"
            className="settings-input"
            value={confirmPhrase}
            disabled={busy}
            placeholder={PURGE_CONFIRM_PHRASE}
            onChange={(e) => setConfirmPhrase(e.target.value)}
          />
          <div className="settings-actions">
            <button type="button" className="settings-btn settings-btn--danger" disabled={busy} onClick={() => void purge()}>
              Confirm delete all data
            </button>
            <button
              type="button"
              className="settings-btn settings-btn--secondary"
              disabled={busy}
              onClick={() => {
                setConfirmOpen(false);
                setConfirmPhrase('');
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      ) : null}

      <p className="settings-panel__status" role="status">
        {status}
      </p>
    </SettingsPanel>
  );
}
