import { useCallback, useEffect, useState } from 'react';
import {
  EXIT_BACKUP_OPTIONS,
  loadExitBackupPreference,
  saveExitBackupPreference,
  type ExitBackupPreference,
} from './backupSettingsService';
import { SettingsFormRow, SettingsPanel } from './SettingsPanel';

export function BackupSettingsPanel() {
  const [preference, setPreference] = useState<ExitBackupPreference>('always_ask');

  useEffect(() => {
    setPreference(loadExitBackupPreference());
  }, []);

  const onChange = useCallback((value: ExitBackupPreference) => {
    setPreference(value);
    saveExitBackupPreference(value);
  }, []);

  const selected = EXIT_BACKUP_OPTIONS.find((o) => o.value === preference) ?? EXIT_BACKUP_OPTIONS[0];

  return (
    <SettingsPanel
      title="Database backup on exit"
      description="Choose how the application behaves when you close the browser tab or sign out. Server-side backups require MongoDB Database Tools on the API host."
    >
      <SettingsFormRow label="On close">
        <select
          className="settings-select"
          value={preference}
          onChange={(e) => onChange(e.target.value as ExitBackupPreference)}
        >
          {EXIT_BACKUP_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </SettingsFormRow>
      <p className="settings-form-row__hint settings-form-row__hint--offset">{selected.description}</p>

      <div className="settings-highlight-box">
        <p className="settings-highlight-box__label">Note</p>
        <p className="settings-highlight-box__note">
          In the desktop ERP, backups are written to a folder on your PC. In the web app, database backups are
          created on the API server when an administrator triggers them from the desktop client or API tools.
          Your close preference is remembered in this browser.
        </p>
      </div>
    </SettingsPanel>
  );
}
