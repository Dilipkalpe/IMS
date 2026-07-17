import { useCallback, useEffect, useMemo, useState } from 'react';
import { probeApiHealth } from '../api/client';
import { deleteUserByUsername, fetchUsersPage, type AppUserRecord } from '../api/users';
import { CorporateDataGrid, type DataGridColumn } from '../components/datagrid/CorporateDataGrid';
import { ListGridArea } from '../components/loading';
import { createListActionColumn } from '../components/transaction/transactionListCrud';
import { TransactionListPagination } from '../components/transaction/TransactionListPagination';
import { LIST_PAGE_SIZES } from '../components/transaction/transactionListQuery';
import { useListNewShortcut } from '../components/transaction/useListNewShortcut';
import { TransactionEntryShell } from '../components/transaction/TransactionEntryShell';
import { useAppNavigation } from '../context/AppNavigationContext';
import { RefinedScreenShell } from '../screens/RefinedScreenShell';
import { StatCounterCard } from '../dashboard/components/StatCounterCard';
import { useUserNavIntent } from './context/UserNavIntent';
import '../dashboard/dashboard.scss';
import './security.scss';

interface UserListRow {
  id: string;
  username: string;
  fullName: string;
  role: string;
  department: string;
  activeStatus: string;
}

function toRow(user: AppUserRecord, index: number): UserListRow {
  return {
    id: user._id ?? user.id ?? user.username ?? String(index),
    username: user.username ?? '',
    fullName: user.fullName ?? '',
    role: user.role ?? '',
    department: user.department?.trim() || '—',
    activeStatus: user.activeStatus !== false ? 'Active' : 'Inactive',
  };
}

function buildUserStats(users: AppUserRecord[]) {
  const active = users.filter((u) => u.activeStatus !== false).length;
  const admins = users.filter(
    (u) =>
      /^administrator$/i.test(u.role ?? '') || /^admin$/i.test(u.role ?? ''),
  ).length;
  const departments = new Set(
    users.map((u) => u.department?.trim()).filter((d) => d && d !== '—'),
  ).size;

  return [
    { label: 'Total Users', value: users.length.toLocaleString('en-IN'), iconGlyph: '\uE77B', accentColor: '#2563eb' },
    { label: 'Active', value: active.toLocaleString('en-IN'), iconGlyph: '\uE73E', accentColor: '#16a34a' },
    { label: 'Admins', value: admins.toLocaleString('en-IN'), iconGlyph: '\uE8D7', accentColor: '#7c3aed' },
    { label: 'Departments', value: departments.toLocaleString('en-IN'), iconGlyph: '\uE8F1', accentColor: '#64748b' },
  ];
}

export function UserListScreen() {
  const navigate = useAppNavigation();
  const userNav = useUserNavIntent();
  const [records, setRecords] = useState<AppUserRecord[]>([]);
  const [statsUsers, setStatsUsers] = useState<AppUserRecord[]>([]);
  const [serverTotal, setServerTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState<number>(LIST_PAGE_SIZES[0]);
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [apiReady, setApiReady] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const totalPages = Math.max(1, Math.ceil(serverTotal / pageSize));
  const rows = useMemo(() => records.map((r, i) => toRow(r, i)), [records]);
  const stats = useMemo(() => buildUserStats(statsUsers), [statsUsers]);

  const recordForRow = useCallback(
    (row: UserListRow) => records.find((r, i) => toRow(r, i).id === row.id) ?? null,
    [records],
  );

  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const apiUp = await probeApiHealth();
      setApiReady(apiUp);
      if (!apiUp) {
        setRecords([]);
        setStatsUsers([]);
        setServerTotal(0);
        setError('API is offline — cannot load users.');
        return;
      }

      const [paged, statsResult] = await Promise.all([
        fetchUsersPage({ page, limit: pageSize, search }),
        fetchUsersPage({ page: 1, limit: 5000, search: '' }),
      ]);
      setRecords(paged.items ?? []);
      setServerTotal(paged.total ?? 0);
      setStatsUsers(statsResult.items ?? []);
    } catch (err) {
      setRecords([]);
      setStatsUsers([]);
      setServerTotal(0);
      setError(err instanceof Error ? err.message : 'Failed to load users.');
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, search]);

  useEffect(() => {
    void reload();
  }, [reload]);

  useEffect(() => {
    const t = window.setTimeout(() => setSearch(searchInput.trim()), 300);
    return () => window.clearTimeout(t);
  }, [searchInput]);

  useEffect(() => {
    setPage(1);
  }, [search, pageSize]);

  const openNew = useCallback(() => {
    userNav.publishOpenIntent({ type: 'new' });
    navigate('user-form');
  }, [navigate, userNav]);

  const openEdit = useCallback(
    (record?: AppUserRecord | null) => {
      const username = record?.username?.trim();
      if (!username) return;
      userNav.publishOpenIntent({ type: 'edit', username });
      navigate('user-form');
    },
    [navigate, userNav],
  );

  const handleDelete = useCallback(
    async (record?: AppUserRecord | null) => {
      const username = record?.username?.trim();
      if (!username) return;
      if (!window.confirm(`Delete user "${username}"? This cannot be undone.`)) return;
      try {
        await deleteUserByUsername(username);
        setSelectedId(null);
        await reload();
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Delete failed.');
      }
    },
    [reload],
  );

  const columns = useMemo<DataGridColumn<UserListRow>[]>(
    () => [
      createListActionColumn({
        rowLabel: (row) => row.username,
        onEdit: (row) => {
          const rec = recordForRow(row);
          if (rec) openEdit(rec);
        },
        onDelete: (row) => {
          const rec = recordForRow(row);
          if (rec) void handleDelete(rec);
        },
      }),
      { id: 'username', header: 'Login', width: 120, readOnly: true, getValue: (r) => r.username },
      { id: 'fullName', header: 'Name', minWidth: 160, readOnly: true, getValue: (r) => r.fullName },
      { id: 'role', header: 'Role', width: 120, readOnly: true, getValue: (r) => r.role },
      { id: 'department', header: 'Department', width: 120, readOnly: true, getValue: (r) => r.department },
      { id: 'activeStatus', header: 'Status', width: 90, readOnly: true, getValue: (r) => r.activeStatus },
    ],
    [handleDelete, openEdit, recordForRow],
  );

  useListNewShortcut(true, openNew);

  return (
    <RefinedScreenShell className="security-list-screen">
      <TransactionEntryShell title="Users">
        <div className="si-list-layout fv-list security-list">
          <p className="security-list__subtitle">Users, roles, and permissions.</p>

          <div className="dash__stats-row security-list__stats">
            {stats.map((stat) => (
              <StatCounterCard key={stat.label} stat={stat} />
            ))}
          </div>

          <div className="si-list-toolbar">
            <div className="fv-list__toolbar si-list-toolbar__row">
              <button type="button" className="wpf-action-button" onClick={openNew} title="Ctrl+N">
                Add User
              </button>
              <input
                className="wpf-form-input si-list-toolbar__search"
                placeholder="Search users…"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
              />
              <button type="button" className="wpf-action-button" onClick={() => void reload()} disabled={loading}>
                Refresh
              </button>
            </div>
            {(error || !apiReady) ? (
              <p className="si-list-toolbar__status" role="status">
                {error ?? 'API offline'}
              </p>
            ) : null}
          </div>

          <ListGridArea loading={loading} className="fv-list__grid-wrap">
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
                const rec = recordForRow(row);
                if (rec) openEdit(rec);
              }}
            />
          </ListGridArea>

          <TransactionListPagination
            page={page}
            pageSize={pageSize}
            totalPages={totalPages}
            totalRecords={serverTotal}
            loading={loading}
            onPageChange={setPage}
            onPageSizeChange={setPageSize}
          />
        </div>
      </TransactionEntryShell>
    </RefinedScreenShell>
  );
}
