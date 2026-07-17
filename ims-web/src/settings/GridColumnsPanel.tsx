import { useCallback, useEffect, useState } from 'react';
import {
  fetchGridColumnModules,
  fetchGridColumnPreferences,
  resetGridColumnGlobalDefault,
  resetGridColumnPreferences,
  saveGridColumnGlobalDefault,
  saveGridColumnPreferences,
  type GridColumnPreferences,
} from '../api/gridColumns';
import { useMenuPermissionSession } from '../context/MenuPermissionContext';
import { SettingsFormRow, SettingsPanel } from './SettingsPanel';

export function GridColumnsPanel() {
  const { isAdministrator } = useMenuPermissionSession();
  const [modules, setModules] = useState<{ key: string; title: string }[]>([]);
  const [moduleKey, setModuleKey] = useState('sales_order');
  const [prefs, setPrefs] = useState<GridColumnPreferences | null>(null);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState('Loading column preferences…');

  const loadModule = useCallback(async (key: string) => {
    setBusy(true);
    try {
      const data = await fetchGridColumnPreferences(key);
      setPrefs(data);
      setStatus(
        data.hasGlobalDefault
          ? 'Organization default is configured for this module.'
          : 'Using your personal column layout.',
      );
    } catch (err) {
      setPrefs(null);
      setStatus(err instanceof Error ? err.message : 'Could not load column preferences.');
    } finally {
      setBusy(false);
    }
  }, []);

  useEffect(() => {
    void fetchGridColumnModules()
      .then((res) => {
        const list = res.modules ?? [];
        setModules(list);
        if (list.length) {
          setModuleKey((current) => (list.some((m) => m.key === current) ? current : list[0].key));
        }
      })
      .catch(() => setStatus('Could not load module list — sign in and ensure the API is online.'));
  }, []);

  useEffect(() => {
    if (moduleKey) void loadModule(moduleKey);
  }, [moduleKey, loadModule]);

  const toggleColumn = useCallback(
    async (columnKey: string, visible: boolean) => {
      if (!prefs || busy) return;
      const mandatory = new Set(prefs.mandatoryColumnKeys ?? []);
      if (mandatory.has(columnKey)) return;

      const visibleKeys = visible
        ? [...new Set([...prefs.visibleColumnKeys, columnKey])]
        : prefs.visibleColumnKeys.filter((k) => k !== columnKey);

      setBusy(true);
      try {
        const saved = await saveGridColumnPreferences(moduleKey, visibleKeys);
        setPrefs(saved);
        setStatus('Column layout saved.');
      } catch (err) {
        setStatus(err instanceof Error ? err.message : 'Save failed.');
      } finally {
        setBusy(false);
      }
    },
    [prefs, busy, moduleKey],
  );

  const handleReset = useCallback(async () => {
    setBusy(true);
    try {
      const saved = await resetGridColumnPreferences(moduleKey);
      setPrefs(saved);
      setStatus('Reset to default column layout.');
    } catch (err) {
      setStatus(err instanceof Error ? err.message : 'Reset failed.');
    } finally {
      setBusy(false);
    }
  }, [moduleKey]);

  const handleSaveGlobal = useCallback(async () => {
    if (!prefs || !isAdministrator) return;
    setBusy(true);
    try {
      const saved = await saveGridColumnGlobalDefault(moduleKey, prefs.visibleColumnKeys);
      setPrefs(saved);
      setStatus('Saved as organization default.');
    } catch (err) {
      setStatus(err instanceof Error ? err.message : 'Save failed.');
    } finally {
      setBusy(false);
    }
  }, [prefs, isAdministrator, moduleKey]);

  const handleResetGlobal = useCallback(async () => {
    if (!isAdministrator) return;
    setBusy(true);
    try {
      const saved = await resetGridColumnGlobalDefault(moduleKey);
      setPrefs(saved);
      setStatus('Organization default reset.');
    } catch (err) {
      setStatus(err instanceof Error ? err.message : 'Reset failed.');
    } finally {
      setBusy(false);
    }
  }, [isAdministrator, moduleKey]);

  return (
    <SettingsPanel
      title="Manage columns"
      description="Show or hide line-item grid columns for sales and purchase documents. Changes apply immediately and are saved per user. Mandatory columns cannot be hidden."
    >
      <SettingsFormRow label="Module">
        <select
          className="settings-select"
          value={moduleKey}
          disabled={busy || modules.length === 0}
          onChange={(e) => setModuleKey(e.target.value)}
        >
          {modules.map((m) => (
            <option key={m.key} value={m.key}>
              {m.title}
            </option>
          ))}
        </select>
      </SettingsFormRow>

      <div className="settings-checkbox-list">
        {prefs?.columns.map((col) => {
          const mandatory = prefs.mandatoryColumnKeys.includes(col.key);
          const checked = prefs.visibleColumnKeys.includes(col.key);
          return (
            <label key={col.key} className="settings-checkbox-item">
              <input
                type="checkbox"
                checked={checked}
                disabled={mandatory || busy}
                onChange={(e) => void toggleColumn(col.key, e.target.checked)}
              />
              <span>
                {col.header}
                {mandatory ? <span className="settings-checkbox-item__mandatory">Required</span> : null}
              </span>
            </label>
          );
        })}
      </div>

      <div className="settings-actions">
        <button type="button" className="settings-btn settings-btn--secondary" disabled={busy} onClick={() => void handleReset()}>
          Reset to default
        </button>
        {isAdministrator ? (
          <>
            <button type="button" className="settings-btn settings-btn--secondary" disabled={busy} onClick={() => void handleSaveGlobal()}>
              Save as organization default
            </button>
            <button type="button" className="settings-btn settings-btn--secondary" disabled={busy} onClick={() => void handleResetGlobal()}>
              Reset organization default
            </button>
          </>
        ) : null}
      </div>

      <p className="settings-panel__status" role="status">
        {status}
      </p>
    </SettingsPanel>
  );
}
