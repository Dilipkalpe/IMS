import { useCallback, useEffect, useMemo, useState } from 'react';
import { probeApiHealth } from '../api/client';
import {
  deleteRole,
  fetchRoles,
  setRoleActive,
  type RoleDto,
} from '../api/roles';
import { CorporateDataGrid, type DataGridColumn } from '../components/datagrid/CorporateDataGrid';
import { ListGridArea } from '../components/loading';
import { TransactionEntryShell } from '../components/transaction/TransactionEntryShell';
import { useAppNavigation } from '../context/AppNavigationContext';
import { useCanManageRoles } from '../context/MenuPermissionContext';
import { RefinedScreenShell } from '../screens/RefinedScreenShell';
import { useRoleNavIntent } from './context/RoleNavIntent';
import './security.scss';

interface RoleListRow {
  id: string;
  roleName: string;
  isActive: string;
  isSystem: string;
}

function toRow(role: RoleDto): RoleListRow {
  return {
    id: role.id,
    roleName: role.roleName,
    isActive: role.isActive ? 'Yes' : 'No',
    isSystem: role.isSystem ? 'Yes' : 'No',
  };
}

export function RoleMasterListScreen() {
  const navigate = useAppNavigation();
  const roleNav = useRoleNavIntent();
  const canManageRoles = useCanManageRoles();
  const [roles, setRoles] = useState<RoleDto[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState('');
  const [apiReady, setApiReady] = useState(true);

  const selectedRole = useMemo(
    () => roles.find((r) => r.id === selectedId) ?? null,
    [roles, selectedId],
  );

  const rows = useMemo(() => roles.map(toRow), [roles]);

  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const apiUp = await probeApiHealth();
      setApiReady(apiUp);
      if (!apiUp) {
        setRoles([]);
        setStatusMessage('API is offline — cannot load roles.');
        return;
      }

      const items = await fetchRoles();
      const sorted = [...items].sort((a, b) => a.roleName.localeCompare(b.roleName));
      setRoles(sorted);
      setSelectedId((current) => {
        if (current && sorted.some((r) => r.id === current)) return current;
        return sorted[0]?.id ?? null;
      });
      setStatusMessage(
        sorted.length === 0
          ? 'No roles defined. Click Add role to create one.'
          : `${sorted.length} role(s) loaded.`,
      );
    } catch (err) {
      setRoles([]);
      setStatusMessage(err instanceof Error ? err.message : 'Failed to load roles.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  const openNew = useCallback(() => {
    if (!canManageRoles) return;
    roleNav.publishOpenIntent({ type: 'new' });
    navigate('role-form');
  }, [canManageRoles, navigate, roleNav]);

  const openEdit = useCallback(
    (role?: RoleDto | null) => {
      if (!canManageRoles || !role) return;
      roleNav.publishOpenIntent({ type: 'edit', id: role.id });
      navigate('role-form');
    },
    [canManageRoles, navigate, roleNav],
  );

  const handleDelete = useCallback(async () => {
    if (!canManageRoles || !selectedRole || selectedRole.isSystem) return;
    if (
      !window.confirm(
        `Delete role "${selectedRole.roleName}"?\n\nUsers assigned to this role must be reassigned first.`,
      )
    ) {
      return;
    }
    setLoading(true);
    try {
      await deleteRole(selectedRole.id);
      await reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Delete failed.');
    } finally {
      setLoading(false);
    }
  }, [canManageRoles, reload, selectedRole]);

  const handleToggleActive = useCallback(async () => {
    if (!canManageRoles || !selectedRole || selectedRole.isSystem) return;
    setLoading(true);
    try {
      await setRoleActive(selectedRole.id, !selectedRole.isActive);
      await reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not update role status.');
    } finally {
      setLoading(false);
    }
  }, [canManageRoles, reload, selectedRole]);

  const columns = useMemo<DataGridColumn<RoleListRow>[]>(
    () => [
      { id: 'roleName', header: 'Role Name', minWidth: 200, readOnly: true, getValue: (r) => r.roleName },
      { id: 'isActive', header: 'Active', width: 90, readOnly: true, getValue: (r) => r.isActive },
      { id: 'isSystem', header: 'System', width: 90, readOnly: true, getValue: (r) => r.isSystem },
    ],
    [],
  );

  const toggleActiveLabel = selectedRole?.isActive === false ? 'Activate' : 'Deactivate';

  return (
    <RefinedScreenShell className="security-list-screen">
      <TransactionEntryShell title="Roles & Permissions">
        <div className="si-list-layout fv-list security-list">
          <p className="security-list__subtitle">
            Define roles and assign menu permissions (View, Add, Edit, Delete, Export).
          </p>

          <div className="fv-list__toolbar si-list-toolbar__row security-list__toolbar">
            <button type="button" className="wpf-action-button" onClick={() => void reload()} disabled={loading}>
              Refresh
            </button>
            <button
              type="button"
              className="wpf-action-button"
              onClick={openNew}
              disabled={loading || !canManageRoles}
            >
              Add role
            </button>
            <button
              type="button"
              className="wpf-action-button"
              onClick={() => openEdit(selectedRole)}
              disabled={loading || !selectedRole || !canManageRoles}
            >
              Edit
            </button>
            <button
              type="button"
              className="wpf-action-button"
              onClick={() => void handleDelete()}
              disabled={loading || !selectedRole || selectedRole.isSystem || !canManageRoles}
            >
              Delete
            </button>
            <button
              type="button"
              className="wpf-action-button"
              onClick={() => void handleToggleActive()}
              disabled={loading || !selectedRole || selectedRole.isSystem || !canManageRoles}
            >
              {toggleActiveLabel}
            </button>
          </div>

          {error ? <p className="mf-form__error">{error}</p> : null}

          <ListGridArea
            loading={loading}
            title="Loading roles…"
            subtitle="Please wait"
            className="fv-list__grid-wrap security-list__grid-host"
          >
            {roles.length === 0 && !loading ? (
              <p className="security-list__empty">No roles found. Use Add role to create the first role.</p>
            ) : null}
            <CorporateDataGrid
              columns={columns}
              data={rows}
              variant="so-list"
              rowHeight={42}
              headerHeight={44}
              minHeight={280}
              selectedRowId={selectedId}
              onRowClick={(row) => setSelectedId(row.id)}
              onRowDoubleClick={(row) => {
                const role = roles.find((r) => r.id === row.id);
                if (role) openEdit(role);
              }}
            />
          </ListGridArea>

          <p className="security-list__status" role="status">
            {statusMessage || (!apiReady ? 'API offline' : '')}
          </p>
        </div>
      </TransactionEntryShell>
    </RefinedScreenShell>
  );
}
