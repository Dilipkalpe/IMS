import { useCallback, useEffect, useState } from 'react';
import {
  fetchEditDeletePasswordStatus,
  updateEditDeleteSecuritySettings,
} from '../api/security';
import { useMenuPermissionSession } from '../context/MenuPermissionContext';
import { SettingsFormRow, SettingsPanel } from './SettingsPanel';

export function EditDeletePasswordPanel() {
  const { isAdministrator } = useMenuPermissionSession();
  const [confirmationRequired, setConfirmationRequired] = useState(true);
  const [configured, setConfigured] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [status, setStatus] = useState('Loading…');
  const [busy, setBusy] = useState(false);

  const refresh = useCallback(async () => {
    if (!isAdministrator) return;
    try {
      const data = await fetchEditDeletePasswordStatus();
      setConfirmationRequired(data.confirmationRequired !== false);
      setConfigured(data.configured);
      setStatus(
        data.configured
          ? `Password configured. Last updated ${data.updatedAt ? new Date(data.updatedAt).toLocaleString() : '—'} by ${data.updatedBy || 'administrator'}.`
          : 'No confirmation password configured yet.',
      );
    } catch (err) {
      setStatus(err instanceof Error ? err.message : 'Could not load security settings.');
    }
  }, [isAdministrator]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const onToggleRequired = useCallback(
    async (required: boolean) => {
      if (!isAdministrator || busy) return;
      setBusy(true);
      try {
        await updateEditDeleteSecuritySettings({ confirmationRequired: required });
        setConfirmationRequired(required);
        setStatus(required ? 'Confirmation password is now required.' : 'Confirmation password requirement disabled.');
      } catch (err) {
        setStatus(err instanceof Error ? err.message : 'Update failed.');
      } finally {
        setBusy(false);
      }
    },
    [isAdministrator, busy],
  );

  const updatePassword = useCallback(async () => {
    if (!isAdministrator || busy) return;
    if (newPassword.length < 6) {
      setStatus('Password must be at least 6 characters.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setStatus('Passwords do not match.');
      return;
    }
    setBusy(true);
    try {
      await updateEditDeleteSecuritySettings({ newPassword });
      setNewPassword('');
      setConfirmPassword('');
      setConfigured(true);
      setStatus('Confirmation password updated.');
      await refresh();
    } catch (err) {
      setStatus(err instanceof Error ? err.message : 'Update failed.');
    } finally {
      setBusy(false);
    }
  }, [isAdministrator, busy, newPassword, confirmPassword, refresh]);

  if (!isAdministrator) return null;

  return (
    <SettingsPanel
      title="Edit/delete confirmation password"
      description="Require a shared password before editing or deleting records across the application."
    >
      <label className="settings-checkbox-item">
        <input
          type="checkbox"
          checked={confirmationRequired}
          disabled={busy}
          onChange={(e) => void onToggleRequired(e.target.checked)}
        />
        <span>Require confirmation password for all edit and delete operations</span>
      </label>

      <SettingsFormRow label="New password">
        <input
          type="password"
          className="settings-input"
          value={newPassword}
          disabled={busy}
          autoComplete="new-password"
          onChange={(e) => setNewPassword(e.target.value)}
        />
      </SettingsFormRow>
      <SettingsFormRow label="Confirm password">
        <input
          type="password"
          className="settings-input"
          value={confirmPassword}
          disabled={busy}
          autoComplete="new-password"
          onChange={(e) => setConfirmPassword(e.target.value)}
        />
      </SettingsFormRow>

      <div className="settings-actions">
        <button type="button" className="settings-btn settings-btn--primary" disabled={busy} onClick={() => void updatePassword()}>
          Update confirmation password
        </button>
      </div>

      <p className="settings-panel__status" role="status">
        {status}
        {configured ? '' : ' (not configured)'}
      </p>
    </SettingsPanel>
  );
}
