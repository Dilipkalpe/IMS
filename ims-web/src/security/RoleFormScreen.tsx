import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { probeApiHealth } from '../api/client';
import {
  createRole,
  fetchMenuTree,
  getRoleById,
  updateRole,
  type RoleDto,
} from '../api/roles';
import { TransactionEntryShell } from '../components/transaction/TransactionEntryShell';
import { ErpFormSection } from '../components/form';
import { useAppNavigation } from '../context/AppNavigationContext';
import { NavKeys } from '../navigation/navKeys';
import { RefinedScreenShell } from '../screens/RefinedScreenShell';
import { useRoleNavIntent } from './context/RoleNavIntent';
import {
  buildPermissionRows,
  clearAllPermissions,
  filterPermissionRows,
  getViewCheckState,
  rowsToPermissionPayload,
  selectAllView,
  updatePermissionRow,
  validateRolePermissions,
  type PermissionRowState,
} from './rolePermissionRows';
import './security.scss';

function TriStateCheckbox({
  state,
  disabled,
  onChange,
}: {
  state: boolean | null;
  disabled?: boolean;
  onChange: (value: boolean) => void;
}) {
  const ref = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (ref.current) ref.current.indeterminate = state === null;
  }, [state]);

  return (
    <input
      ref={ref}
      type="checkbox"
      className="security-perm__check"
      checked={state === true}
      disabled={disabled}
      onChange={(e) => onChange(e.target.checked)}
    />
  );
}

function PermissionMatrix({
  rows,
  filterText,
  canEditFields,
  onChange,
}: {
  rows: PermissionRowState[];
  filterText: string;
  canEditFields: boolean;
  onChange: (rows: PermissionRowState[]) => void;
}) {
  const visibleRows = useMemo(() => filterPermissionRows(rows, filterText), [filterText, rows]);

  return (
    <div className="security-perm__table-wrap">
      <table className="security-perm__table">
        <thead>
          <tr>
            <th>Menu</th>
            <th>View</th>
            <th>Add</th>
            <th>Edit</th>
            <th>Delete</th>
            <th>Export</th>
          </tr>
        </thead>
        <tbody>
          {visibleRows.map((row) => {
            const viewState = getViewCheckState(row, rows);
            const detailDisabled = !canEditFields || row.isSection || !row.canView;
            return (
              <tr key={row.menuKey} className={row.isSection ? 'security-perm__row--section' : undefined}>
                <td>
                  <span
                    className="security-perm__menu-name"
                    style={{
                      marginLeft: row.indent * 18,
                      fontWeight: row.isSection ? 600 : 400,
                    }}
                  >
                    {row.menuName}
                  </span>
                </td>
                <td className="security-perm__cell-check">
                  <TriStateCheckbox
                    state={viewState}
                    disabled={!canEditFields}
                    onChange={(value) => onChange(updatePermissionRow(rows, row.menuKey, { field: 'canView', value }))}
                  />
                </td>
                <td className="security-perm__cell-check">
                  <input
                    type="checkbox"
                    className="security-perm__check"
                    checked={row.canAdd}
                    disabled={detailDisabled}
                    onChange={(e) =>
                      onChange(
                        updatePermissionRow(rows, row.menuKey, { field: 'canAdd', value: e.target.checked }),
                      )
                    }
                  />
                </td>
                <td className="security-perm__cell-check">
                  <input
                    type="checkbox"
                    className="security-perm__check"
                    checked={row.canEdit}
                    disabled={detailDisabled}
                    onChange={(e) =>
                      onChange(
                        updatePermissionRow(rows, row.menuKey, { field: 'canEdit', value: e.target.checked }),
                      )
                    }
                  />
                </td>
                <td className="security-perm__cell-check">
                  <input
                    type="checkbox"
                    className="security-perm__check"
                    checked={row.canDelete}
                    disabled={detailDisabled}
                    onChange={(e) =>
                      onChange(
                        updatePermissionRow(rows, row.menuKey, { field: 'canDelete', value: e.target.checked }),
                      )
                    }
                  />
                </td>
                <td className="security-perm__cell-check">
                  <input
                    type="checkbox"
                    className="security-perm__check"
                    checked={row.canExport}
                    disabled={detailDisabled}
                    onChange={(e) =>
                      onChange(
                        updatePermissionRow(rows, row.menuKey, { field: 'canExport', value: e.target.checked }),
                      )
                    }
                  />
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export function RoleFormScreen() {
  const navigate = useAppNavigation();
  const { consumeOpenIntent } = useRoleNavIntent();
  const [mode, setMode] = useState<'new' | 'edit'>('new');
  const [existing, setExisting] = useState<RoleDto | null>(null);
  const [roleName, setRoleName] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [permissionRows, setPermissionRows] = useState<PermissionRowState[]>([]);
  const [menuFilter, setMenuFilter] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState('');

  const isSystemRole = existing?.isSystem === true;
  const canEditRoleFields = !isSystemRole;

  const loadIntent = useCallback(async (intent: { type: 'new' } | { type: 'edit'; id: string }) => {
    setError(null);
    setStatusMessage('');
    setMenuFilter('');

    const apiUp = await probeApiHealth();
    if (!apiUp) {
      setError('API offline — cannot load role data.');
      return;
    }

    setLoading(true);
    try {
      if (intent.type === 'new') {
        setMode('new');
        setExisting(null);
        setRoleName('');
        setIsActive(true);
        setStatusMessage('Loading menus…');
        const menus = await fetchMenuTree();
        setPermissionRows(buildPermissionRows(menus, []));
        setStatusMessage(`${menus.length} root menu(s) loaded.`);
        return;
      }

      setMode('edit');
      setStatusMessage('Loading role…');
      const detail = await getRoleById(intent.id);
      const role = detail.role ?? null;
      setExisting(role);
      setRoleName(role?.roleName ?? '');
      setIsActive(role?.isActive !== false);
      setPermissionRows(buildPermissionRows(detail.menus ?? [], detail.permissions ?? []));
      setStatusMessage(`${detail.menus?.length ?? 0} root menu(s) loaded.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load role.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => consumeOpenIntent((intent) => void loadIntent(intent)), [consumeOpenIntent, loadIntent]);

  const title = mode === 'new' ? 'Add Role' : 'Edit Role';
  const filteredCount = useMemo(
    () => filterPermissionRows(permissionRows, menuFilter).length,
    [menuFilter, permissionRows],
  );

  const handleSave = async () => {
    const name = roleName.trim();
    if (!name) {
      setError('Role name is required.');
      return;
    }

    const validationError = validateRolePermissions(permissionRows);
    if (validationError) {
      setError(validationError);
      return;
    }

    setSaving(true);
    setError(null);
    try {
      const payload = {
        roleName: name,
        isActive,
        permissions: rowsToPermissionPayload(permissionRows),
      };

      if (mode === 'new') {
        await createRole(payload);
      } else if (existing) {
        await updateRole(existing.id, payload);
      }

      navigate(NavKeys.RoleMaster);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Save failed.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <RefinedScreenShell className="security-form-screen">
      <TransactionEntryShell title={title}>
        <div className="security-role-form">
          <p className="security-form__subtitle">
            Select menus and assign View / Add / Edit / Delete / Export permissions.
          </p>

          {loading ? <p className="mf-form__status">Loading…</p> : null}
          {error ? <p className="mf-form__error">{error}</p> : null}

          <ErpFormSection className="security-role-form__header-card">
            <div className="security-role-form__header">
            <label className="security-role-form__name si-field">
              <span className="erp-form-field__label">Role name</span>
              <input
                className="wpf-form-input"
                value={roleName}
                readOnly={!canEditRoleFields}
                onChange={(e) => setRoleName(e.target.value)}
              />
            </label>
            <label className="security-role-form__active">
              <input
                type="checkbox"
                checked={isActive}
                disabled={!canEditRoleFields}
                onChange={(e) => setIsActive(e.target.checked)}
              />
              <span>Active</span>
            </label>
            </div>

            <div className="security-role-form__filter-row erp-form-filter-row">
              <input
                className="wpf-form-input security-role-form__filter"
                placeholder="Filter menus by name…"
                value={menuFilter}
                onChange={(e) => setMenuFilter(e.target.value)}
              />
              <div className="security-role-form__filter-actions">
                <button
                  type="button"
                  className="wpf-action-button"
                  disabled={!menuFilter.trim()}
                  onClick={() => setMenuFilter('')}
                >
                  Clear filter
                </button>
                <button
                  type="button"
                  className="wpf-action-button"
                  disabled={loading || saving}
                  onClick={() => setPermissionRows((rows) => selectAllView(rows))}
                >
                  Select all View
                </button>
                <button
                  type="button"
                  className="wpf-action-button"
                  disabled={loading || saving}
                  onClick={() => setPermissionRows((rows) => clearAllPermissions(rows))}
                >
                  Clear all
                </button>
              </div>
            </div>
          </ErpFormSection>

          <div className="security-role-form__matrix">
            <PermissionMatrix
              rows={permissionRows}
              filterText={menuFilter}
              canEditFields={canEditRoleFields}
              onChange={setPermissionRows}
            />
          </div>

          <p className="security-list__status">
            {statusMessage}
            {menuFilter.trim() ? ` • ${filteredCount} row(s) shown` : ''}
          </p>

          <div className="mf-form__actions">
            <button
              type="button"
              className="wpf-action-button"
              disabled={saving || loading}
              onClick={() => void handleSave()}
            >
              {saving ? 'Saving…' : 'Save'}
            </button>
            <button
              type="button"
              className="wpf-secondary-button"
              disabled={saving}
              onClick={() => navigate(NavKeys.RoleMaster)}
            >
              Close
            </button>
          </div>
        </div>
      </TransactionEntryShell>
    </RefinedScreenShell>
  );
}
