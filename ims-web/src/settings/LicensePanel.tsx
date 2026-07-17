import { useCallback, useEffect, useState } from 'react';
import {
  extendLicense,
  fetchLicenseAdminDetails,
  renewLicense,
  type LicenseAdminDetails,
} from '../api/license';
import { probeApiHealth } from '../api/client';
import { useMenuPermissionSession } from '../context/MenuPermissionContext';
import { SettingsFormRow, SettingsPanel } from './SettingsPanel';

const PLAN_OPTIONS = [15, 30, 45];

function formatDate(iso?: string | null): string {
  if (!iso) return '—';
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? iso : d.toLocaleDateString();
}

export function LicensePanel() {
  const { isAdministrator } = useMenuPermissionSession();
  const [status, setStatus] = useState<LicenseAdminDetails | null>(null);
  const [statusText, setStatusText] = useState('Loading license status…');
  const [actionMessage, setActionMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const [licenseType, setLicenseType] = useState<'trial' | 'permanent'>('trial');
  const [planDays, setPlanDays] = useState('30');
  const [extendDays, setExtendDays] = useState('15');
  const [extendNote, setExtendNote] = useState('');

  const refresh = useCallback(async () => {
    if (!isAdministrator) return;
    setBusy(true);
    setActionMessage('');
    try {
      const apiUp = await probeApiHealth();
      if (!apiUp) {
        setStatusText('API is offline. Start the API to view license status.');
        setStatus(null);
        return;
      }
      const details = await fetchLicenseAdminDetails();
      setStatus(details);
      setLicenseType(details.isPermanent ? 'permanent' : 'trial');
      if (details.planDays && PLAN_OPTIONS.includes(details.planDays)) {
        setPlanDays(String(details.planDays));
      }
      if (details.isPermanent) {
        setStatusText(`${details.message} Activated ${formatDate(details.activatedAt)}.`);
      } else {
        const expiry = formatDate(details.expiresAt);
        const activated = formatDate(details.activatedAt);
        setStatusText(
          details.isExpired
            ? `${details.message} Expired ${expiry}. Activated ${activated}.`
            : `${details.message} Expires ${expiry}. Activated ${activated}.`,
        );
      }
    } catch (err) {
      setStatusText('Failed to load software license status.');
      setActionMessage(err instanceof Error ? err.message : 'Load failed.');
    } finally {
      setBusy(false);
    }
  }, [isAdministrator]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const applyLicense = useCallback(async () => {
    if (!isAdministrator || busy) return;
    setBusy(true);
    setActionMessage('');
    try {
      const days = licenseType === 'trial' ? Number(planDays) : undefined;
      if (licenseType === 'trial' && (!days || days < 1)) {
        setActionMessage('Enter valid days as a positive number for the trial license.');
        return;
      }
      const result = await renewLicense({
        licenseType,
        planDays: licenseType === 'trial' ? days : undefined,
      });
      setActionMessage(result.message ?? 'License applied.');
      await refresh();
    } catch (err) {
      setActionMessage(err instanceof Error ? err.message : 'Apply failed.');
    } finally {
      setBusy(false);
    }
  }, [isAdministrator, busy, licenseType, planDays, refresh]);

  const applyPermanent = useCallback(async () => {
    setLicenseType('permanent');
    setBusy(true);
    setActionMessage('');
    try {
      const result = await renewLicense({ licenseType: 'permanent' });
      setActionMessage(result.message ?? 'Permanent license applied.');
      await refresh();
    } catch (err) {
      setActionMessage(err instanceof Error ? err.message : 'Apply failed.');
    } finally {
      setBusy(false);
    }
  }, [refresh]);

  const extend = useCallback(
    async (daysOverride?: number) => {
      if (!isAdministrator || busy || licenseType === 'permanent') return;
      const days = daysOverride ?? Number(extendDays);
      if (!days || days < 1) {
        setActionMessage('Enter extension days as a positive number.');
        return;
      }
      setBusy(true);
      setActionMessage('');
      try {
        const result = await extendLicense({ days, note: extendNote.trim() || undefined });
        setActionMessage(result.message ?? `Trial license extended by ${days} day(s).`);
        setExtendNote('');
        await refresh();
      } catch (err) {
        setActionMessage(err instanceof Error ? err.message : 'Extend failed.');
      } finally {
        setBusy(false);
      }
    },
    [isAdministrator, busy, licenseType, extendDays, extendNote, refresh],
  );

  if (!isAdministrator) return null;

  return (
    <SettingsPanel title="Software license" description="Manage trial and permanent software licenses for this installation.">
      <p className="settings-panel__active">{statusText}</p>

      <SettingsFormRow label="License type">
        <select
          className="settings-select"
          value={licenseType}
          disabled={busy}
          onChange={(e) => setLicenseType(e.target.value as 'trial' | 'permanent')}
        >
          <option value="trial">Trial</option>
          <option value="permanent">Permanent</option>
        </select>
      </SettingsFormRow>

      {licenseType === 'trial' ? (
        <SettingsFormRow label="Valid days">
          <div className="settings-inline-actions">
            <input
              type="number"
              className="settings-input settings-input--narrow"
              min={1}
              value={planDays}
              disabled={busy}
              onChange={(e) => setPlanDays(e.target.value)}
            />
            {PLAN_OPTIONS.map((d) => (
              <button
                key={d}
                type="button"
                className="settings-btn settings-btn--secondary settings-btn--compact"
                disabled={busy}
                onClick={() => setPlanDays(String(d))}
              >
                {d}
              </button>
            ))}
          </div>
        </SettingsFormRow>
      ) : null}

      <div className="settings-actions">
        <button type="button" className="settings-btn settings-btn--primary" disabled={busy} onClick={() => void applyLicense()}>
          Apply license
        </button>
        <button type="button" className="settings-btn settings-btn--secondary" disabled={busy} onClick={() => void applyPermanent()}>
          Apply permanent license
        </button>
      </div>

      {licenseType === 'trial' ? (
        <>
          <SettingsFormRow label="Extend by (days)">
            <div className="settings-inline-actions">
              <input
                type="number"
                className="settings-input settings-input--narrow"
                min={1}
                value={extendDays}
                disabled={busy}
                onChange={(e) => setExtendDays(e.target.value)}
              />
              {PLAN_OPTIONS.map((d) => (
                <button
                  key={d}
                  type="button"
                  className="settings-btn settings-btn--secondary settings-btn--compact"
                  disabled={busy}
                  onClick={() => void extend(d)}
                >
                  +{d}
                </button>
              ))}
            </div>
          </SettingsFormRow>
          <SettingsFormRow label="Extension note">
            <input
              type="text"
              className="settings-input"
              value={extendNote}
              disabled={busy}
              onChange={(e) => setExtendNote(e.target.value)}
            />
          </SettingsFormRow>
          <div className="settings-actions">
            <button type="button" className="settings-btn settings-btn--primary" disabled={busy} onClick={() => void extend()}>
              Extend license
            </button>
          </div>
        </>
      ) : null}

      {status?.extensions?.length ? (
        <div className="settings-highlight-box">
          <p className="settings-highlight-box__label">Recent extensions</p>
          <ul className="settings-list-plain">
            {status.extensions.slice(0, 5).map((ext, i) => (
              <li key={`${ext.extendedAt}-${i}`}>
                +{ext.days} days — {formatDate(ext.extendedAt)} by {ext.extendedBy || 'admin'}
                {ext.note ? ` (${ext.note})` : ''}
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <p className="settings-panel__status" role="status">
        {actionMessage}
      </p>
    </SettingsPanel>
  );
}
