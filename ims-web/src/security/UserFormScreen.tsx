import { useCallback, useEffect, useMemo, useState } from 'react';
import { probeApiHealth } from '../api/client';
import { fetchActiveRoleNames } from '../api/roles';
import {
  createUser,
  getUserByUsername,
  updateUserByUsername,
  userFormToPayload,
  type AppUserRecord,
} from '../api/users';
import { TransactionEntryShell } from '../components/transaction/TransactionEntryShell';
import { ErpFormGrid, ErpFormSection } from '../components/form';
import { useAppNavigation } from '../context/AppNavigationContext';
import { useMenuPermissionSession } from '../context/MenuPermissionContext';
import { NavKeys } from '../navigation/navKeys';
import { RefinedScreenShell } from '../screens/RefinedScreenShell';
import { useUserNavIntent } from './context/UserNavIntent';
import {
  DEFAULT_ROLE_OPTIONS,
  DEPARTMENT_OPTIONS,
  USER_STATUS_OPTIONS,
} from './userConstants';
import '../masters/master-form.scss';
import './security.scss';

const EMPTY: AppUserRecord = {
  username: '',
  fullName: '',
  role: 'Viewer',
  department: 'Administration',
  email: '',
  activeStatus: true,
  canPrintBarcodeLabels: false,
};

export function UserFormScreen() {
  const navigate = useAppNavigation();
  const { consumeOpenIntent } = useUserNavIntent();
  const { isAdministrator } = useMenuPermissionSession();
  const [mode, setMode] = useState<'new' | 'edit'>('new');
  const [originalUsername, setOriginalUsername] = useState('');
  const [form, setForm] = useState<AppUserRecord>(EMPTY);
  const [password, setPassword] = useState('');
  const [roleOptions, setRoleOptions] = useState<string[]>([...DEFAULT_ROLE_OPTIONS]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);

  const loadRoleOptions = useCallback(async () => {
    if (!isAdministrator) {
      setRoleOptions([...DEFAULT_ROLE_OPTIONS]);
      return;
    }
    try {
      const names = await fetchActiveRoleNames();
      setRoleOptions(names.length > 0 ? names : [...DEFAULT_ROLE_OPTIONS]);
    } catch {
      setRoleOptions([...DEFAULT_ROLE_OPTIONS]);
    }
  }, [isAdministrator]);

  const loadIntent = useCallback(
    async (intent: { type: 'new' } | { type: 'edit'; username: string }) => {
      setError(null);
      setStatus(null);
      setPassword('');
      await loadRoleOptions();

      const apiUp = await probeApiHealth();
      if (!apiUp) {
        setError('API offline — cannot load user data.');
      }

      if (intent.type === 'new') {
        setMode('new');
        setOriginalUsername('');
        setForm({ ...EMPTY });
        return;
      }

      setMode('edit');
      setOriginalUsername(intent.username);
      if (!apiUp) return;

      setLoading(true);
      try {
        const user = await getUserByUsername(intent.username);
        setForm({
          username: user.username ?? '',
          fullName: user.fullName ?? '',
          role: user.role ?? 'Viewer',
          department: user.department?.trim() || 'Administration',
          email: user.email ?? '',
          activeStatus: user.activeStatus !== false,
          canPrintBarcodeLabels: user.canPrintBarcodeLabels === true,
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load user.');
      } finally {
        setLoading(false);
      }
    },
    [loadRoleOptions],
  );

  useEffect(() => consumeOpenIntent((intent) => void loadIntent(intent)), [consumeOpenIntent, loadIntent]);

  const title = useMemo(
    () => (mode === 'new' ? 'Add User' : 'Edit User'),
    [mode],
  );

  const description = useMemo(
    () =>
      mode === 'new'
        ? 'Create a user with role and department access.'
        : 'Update user role, department, and status.',
    [mode],
  );

  const handleSave = async () => {
    const username = form.username.trim();
    const fullName = form.fullName.trim();
    const role = form.role.trim();

    if (!username || !fullName || !role) {
      setError('Username, full name, and role are required.');
      return;
    }
    if (mode === 'new' && !password.trim()) {
      setError('Password is required for new users.');
      return;
    }
    if (password.trim() && password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    setSaving(true);
    setError(null);
    try {
      const payload = userFormToPayload({
        username,
        fullName,
        role,
        department: form.department ?? '',
        email: form.email ?? '',
        password,
        activeStatus: form.activeStatus !== false,
        canPrintBarcodeLabels: form.canPrintBarcodeLabels === true,
      });

      if (mode === 'new') {
        await createUser(payload);
        setStatus('User created.');
      } else {
        await updateUserByUsername(originalUsername, payload);
        setStatus('User updated.');
      }
      navigate(NavKeys.UserRoles);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Save failed.');
    } finally {
      setSaving(false);
    }
  };

  const statusLabel = form.activeStatus !== false ? 'Active' : 'Inactive';

  return (
    <RefinedScreenShell className="security-form-screen">
      <TransactionEntryShell title={title}>
        <div className="mf-form security-form">
          <p className="security-form__subtitle">{description}</p>
          {loading ? <p className="mf-form__status">Loading user…</p> : null}
          {error ? <p className="mf-form__error">{error}</p> : null}
          {status ? <p className="mf-form__status">{status}</p> : null}

          <ErpFormSection>
            <ErpFormGrid columns={2}>
            <label className="si-field">
              <span className="erp-form-field__label">Username *</span>
              <input
                className="wpf-form-input"
                value={form.username}
                readOnly={mode === 'edit'}
                placeholder="e.g. jsmith"
                onChange={(e) => setForm((prev) => ({ ...prev, username: e.target.value }))}
              />
            </label>
            <label className="si-field">
              <span className="erp-form-field__label">Full Name *</span>
              <input
                className="wpf-form-input"
                value={form.fullName}
                placeholder="e.g. John Smith"
                onChange={(e) => setForm((prev) => ({ ...prev, fullName: e.target.value }))}
              />
            </label>
            <label className="si-field">
              <span className="erp-form-field__label">{mode === 'new' ? 'Password *' : 'Password'}</span>
              <input
                className="wpf-form-input"
                type="password"
                value={password}
                placeholder={mode === 'new' ? 'minimum 6 characters' : 'leave blank to keep existing'}
                onChange={(e) => setPassword(e.target.value)}
              />
            </label>
            <label className="si-field">
              <span className="erp-form-field__label">Role *</span>
              <select
                className="wpf-form-combo"
                value={form.role}
                onChange={(e) => setForm((prev) => ({ ...prev, role: e.target.value }))}
              >
                {roleOptions.map((role) => (
                  <option key={role} value={role}>
                    {role}
                  </option>
                ))}
              </select>
            </label>
            <label className="si-field">
              <span className="erp-form-field__label">Department</span>
              <select
                className="wpf-form-combo"
                value={form.department || 'Administration'}
                onChange={(e) => setForm((prev) => ({ ...prev, department: e.target.value }))}
              >
                {DEPARTMENT_OPTIONS.map((dept) => (
                  <option key={dept} value={dept}>
                    {dept}
                  </option>
                ))}
              </select>
            </label>
            <label className="si-field">
              <span className="erp-form-field__label">Email</span>
              <input
                className="wpf-form-input"
                type="email"
                value={form.email ?? ''}
                placeholder="user@company.com"
                onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))}
              />
            </label>
            <label className="si-field">
              <span className="erp-form-field__label">Status</span>
              <select
                className="wpf-form-combo"
                value={statusLabel}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    activeStatus: e.target.value === 'Active',
                  }))
                }
              >
                {USER_STATUS_OPTIONS.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            </label>
            <label className="mf-form__field mf-form__field--check">
              <input
                type="checkbox"
                checked={form.canPrintBarcodeLabels === true}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, canPrintBarcodeLabels: e.target.checked }))
                }
              />
              <span>Barcode label printing</span>
            </label>
            </ErpFormGrid>
          </ErpFormSection>

          <div className="mf-form__actions">
            <button type="button" className="wpf-action-button" disabled={saving} onClick={() => void handleSave()}>
              {saving ? 'Saving…' : 'Save'}
            </button>
            <button
              type="button"
              className="wpf-secondary-button"
              disabled={saving}
              onClick={() => navigate(NavKeys.UserRoles)}
            >
              Close
            </button>
          </div>
        </div>
      </TransactionEntryShell>
    </RefinedScreenShell>
  );
}
