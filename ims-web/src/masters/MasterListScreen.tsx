import { useCallback, useEffect, useMemo, useState } from 'react';
import { useCanManageBom } from '../auth/useCanManageBom';
import { CorporateDataGrid, type DataGridColumn } from '../components/datagrid/CorporateDataGrid';
import { ListGridArea } from '../components/loading';
import { ListExportMenu } from '../components/transaction/ListExportMenu';
import { createListActionColumn } from '../components/transaction/transactionListCrud';
import { TransactionListPagination } from '../components/transaction/TransactionListPagination';
import { LIST_PAGE_SIZES } from '../components/transaction/transactionListQuery';
import { useListNewShortcut } from '../components/transaction/useListNewShortcut';
import { probeApiHealth } from '../api/client';
import { invalidateDefaultCompanyCache, fetchCompanyByCode } from '../api/companies';
import {
  createMasterRecord,
  deleteMasterRecord,
  fetchMasterFlatArray,
  fetchMasterItemsArray,
  fetchMasterPage,
  updateMasterRecord,
} from '../api/masters';
import { deleteAccountByCode } from '../api/accounts';
import { deletePayrollEmployeeByCode } from '../api/payrollEmployees';
import { deleteProductByCode } from '../api/products';
import { useAppNavigation } from '../context/AppNavigationContext';
import { RefinedScreenShell } from '../screens/RefinedScreenShell';
import { TransactionEntryShell } from '../components/transaction/TransactionEntryShell';
import '../sales-invoice/sales-invoice.scss';
import '../finance/finance-voucher.scss';
import { useAccountMasterNavIntent } from './context/AccountMasterNavIntent';
import { usePayrollEmployeeNavIntent } from '../payroll/context/PayrollEmployeeNavIntent';
import { employeeTypeLabel } from '../payroll/payrollEmployeeTypes';
import { useProductMasterNavIntent } from './context/ProductMasterNavIntent';
import { MasterCrudDialog } from './MasterCrudDialog';
import type { MasterCrudField, MasterListConfig } from './masterConfigs';
import { useMasterListExportActions } from './useMasterListExportActions';
import { useProtectedMasterListActions } from './useProtectedMasterListActions';
import './master-form.scss';

interface MasterListRow {
  id: string;
  [key: string]: string;
}

function formatCellValue(value: unknown): string {
  if (value == null) return '';
  if (typeof value === 'boolean') return value ? 'Yes' : 'No';
  if (typeof value === 'number') {
    return Number.isInteger(value) ? String(value) : value.toFixed(2);
  }
  if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}/.test(value)) {
    const d = new Date(value);
    if (!Number.isNaN(d.getTime())) return d.toLocaleDateString('en-IN');
  }
  return String(value);
}

function recordToRow(record: Record<string, unknown>, config: MasterListConfig, index: number): MasterListRow {
  const id =
    (record._id != null ? String(record._id) : null) ??
    (record.id != null ? String(record.id) : null) ??
    (record.code != null ? String(record.code) : null) ??
    (record.username != null ? String(record.username) : null) ??
    String(index);

  const row: MasterListRow = { id };
  for (const col of config.columns) {
    let raw = record[col.field];
    if (col.field === 'employeeType') raw = employeeTypeLabel(raw);
    if (col.field === 'activeStatus' && typeof raw === 'boolean') {
      row[col.id] = raw ? 'Active' : 'Inactive';
      continue;
    }
    if (col.field === 'monthlySalary' || col.field === 'dailyWage') {
      const n = Number(raw);
      raw = n > 0 ? n : '';
    }
    row[col.id] = formatCellValue(raw);
  }
  return row;
}

function filterClientRecords(
  records: Record<string, unknown>[],
  search: string,
  fields?: string[],
): Record<string, unknown>[] {
  const needle = search.trim().toLowerCase();
  if (!needle) return records;
  const keys = fields ?? ['code', 'name', 'roleName', 'financialYearName', 'description'];
  return records.filter((record) =>
    keys.some((key) => formatCellValue(record[key]).toLowerCase().includes(needle)),
  );
}

function getRecordKey(record: Record<string, unknown>, config: MasterListConfig): string {
  const field = config.crudKeyField ?? 'code';
  const value = record[field];
  return value == null ? '' : String(value);
}

function fieldsForCrudMode(
  fields: MasterCrudField[] | undefined,
  mode: 'new' | 'edit',
  config: MasterListConfig,
): MasterCrudField[] {
  if (!fields?.length) return [];
  const keyField = config.crudKeyField ?? 'code';
  return fields
    .filter((field) => !field.showOn || field.showOn === 'both' || field.showOn === mode)
    .map((field) => ({
      ...field,
      readOnly: field.readOnly || (field.key === keyField && mode === 'edit'),
    }));
}

export function MasterListScreen({ config }: { config: MasterListConfig }) {
  const navigate = useAppNavigation();
  const canManageBom = useCanManageBom();
  const productNav = useProductMasterNavIntent();
  const accountNav = useAccountMasterNavIntent();
  const payrollEmployeeNav = usePayrollEmployeeNavIntent();
  const [allRecords, setAllRecords] = useState<Record<string, unknown>[]>([]);
  const [serverTotal, setServerTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState<number>(LIST_PAGE_SIZES[0]);
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState('');
  const [apiReady, setApiReady] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [crudOpen, setCrudOpen] = useState(false);
  const [crudMode, setCrudMode] = useState<'new' | 'edit'>('new');
  const [crudValues, setCrudValues] = useState<Record<string, unknown>>({});
  const [crudOriginalKey, setCrudOriginalKey] = useState('');
  const [crudSaving, setCrudSaving] = useState(false);
  const [crudError, setCrudError] = useState<string | null>(null);

  const isClientPaged = config.fetchMode !== 'paged';
  const hasFormCrud = Boolean(config.formNavKey && config.crudEntity);
  const hasApiCrud = Boolean(config.apiCrud && config.crudFields?.length);
  const canMutate = hasFormCrud || hasApiCrud;
  const showEditDelete = canMutate && !config.createOnly;
  const addActionLabel = config.addActionLabel ?? 'New';
  const showBomAction = Boolean(config.showBomAction && canManageBom);
  const showExport = config.showExport === true;

  const filteredRecords = useMemo(() => {
    if (!isClientPaged) return allRecords;
    return filterClientRecords(allRecords, search, config.searchFields);
  }, [allRecords, config.searchFields, isClientPaged, search]);

  const total = isClientPaged ? filteredRecords.length : serverTotal;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  const pageRecords = useMemo(() => {
    if (!isClientPaged) return allRecords;
    const start = (page - 1) * pageSize;
    return filteredRecords.slice(start, start + pageSize);
  }, [allRecords, filteredRecords, isClientPaged, page, pageSize]);

  const rows = useMemo(
    () => pageRecords.map((record, index) => recordToRow(record, config, index)),
    [config, pageRecords],
  );

  const recordForRow = useCallback(
    (row: MasterListRow) =>
      pageRecords.find((item, index) => recordToRow(item, config, index).id === row.id) ?? null,
    [config, pageRecords],
  );

  const masterRowLabel = useCallback(
    (row: MasterListRow) =>
      row.code || row.employeeCode || row.name || row.fullName || row.runNo || row.billNo || row.id,
    [],
  );

  const selectedRecord = useMemo(() => {
    if (!selectedId) return null;
    return (
      pageRecords.find((record, index) => recordToRow(record, config, index).id === selectedId) ?? null
    );
  }, [config, pageRecords, selectedId]);

  const crudDialogFields = useMemo(
    () => fieldsForCrudMode(config.crudFields, crudMode, config),
    [config, crudMode],
  );

  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const apiUp = await probeApiHealth();
      setApiReady(apiUp);
      if (!apiUp) {
        setAllRecords([]);
        setServerTotal(0);
        setError('API is offline — cannot load master data.');
        return;
      }

      if (config.fetchMode === 'paged') {
        const result = await fetchMasterPage(config.apiPath, {
          page,
          limit: pageSize,
          search,
          query: config.query,
        });
        setAllRecords(result.items ?? []);
        setServerTotal(result.total ?? 0);
      } else if (config.fetchMode === 'items-array') {
        const items = await fetchMasterItemsArray(config.apiPath);
        setAllRecords(items);
        setServerTotal(items.length);
      } else {
        const items = await fetchMasterFlatArray(config.apiPath);
        setAllRecords(items);
        setServerTotal(items.length);
      }
    } catch (err) {
      setAllRecords([]);
      setServerTotal(0);
      setError(err instanceof Error ? err.message : 'Failed to load master data.');
    } finally {
      setLoading(false);
    }
  }, [config.apiPath, config.fetchMode, config.query, page, pageSize, search]);

  useEffect(() => {
    void reload();
  }, [reload]);

  useEffect(() => {
    const t = window.setTimeout(() => setSearch(searchInput.trim()), 300);
    return () => window.clearTimeout(t);
  }, [searchInput]);

  useEffect(() => {
    setPage(1);
  }, [search, pageSize, config.listNavKey]);

  useEffect(() => {
    const storageKey = `ims.masterList.initialSearch.${config.listNavKey}`;
    const initial = sessionStorage.getItem(storageKey)?.trim();
    if (!initial) return;
    sessionStorage.removeItem(storageKey);
    setSearchInput(initial);
    setSearch(initial);
  }, [config.listNavKey]);

  const openApiCrudNew = useCallback(() => {
    setCrudMode('new');
    setCrudValues({});
    setCrudOriginalKey('');
    setCrudError(null);
    setCrudOpen(true);
  }, []);

  const openApiCrudEdit = useCallback((record: Record<string, unknown>) => {
    setCrudMode('edit');
    setCrudOriginalKey(getRecordKey(record, config));
    setCrudError(null);
    setCrudOpen(true);

    if (config.apiPath === 'companies') {
      const code = String(record.code ?? '').trim();
      if (code) {
        void fetchCompanyByCode(code).then((full) => {
          if (full) setCrudValues({ ...full });
          else setCrudValues({ ...record });
        });
        return;
      }
    }

    setCrudValues({ ...record });
  }, [config]);

  const openNewFormCore = useCallback(() => {
    if (hasApiCrud) {
      openApiCrudNew();
      return;
    }
    if (!config.formNavKey || !config.crudEntity) return;
    if (config.crudEntity === 'product') {
      productNav.publishOpenIntent({ type: 'new' });
    } else if (config.crudEntity === 'account') {
      accountNav.publishOpenIntent({
        type: 'new',
        accountType: config.query?.type === 'supplier' ? 'supplier' : 'customer',
      });
    } else if (config.crudEntity === 'payrollEmployee') {
      payrollEmployeeNav.publishOpenIntent({ type: 'new' });
    }
    navigate(config.formNavKey);
  }, [
    accountNav,
    config.crudEntity,
    config.formNavKey,
    config.query?.type,
    hasApiCrud,
    navigate,
    openApiCrudNew,
    payrollEmployeeNav,
    productNav,
  ]);

  const openEditFormCore = useCallback(
    (record: Record<string, unknown>) => {
      if (hasApiCrud) {
        openApiCrudEdit(record);
        return;
      }

      const code = formatCellValue(record.code ?? record.employeeCode);
      if (!config.formNavKey || !code || !config.crudEntity) return;
      if (config.crudEntity === 'product') {
        productNav.publishOpenIntent({ type: 'edit', code });
      } else if (config.crudEntity === 'account') {
        accountNav.publishOpenIntent({ type: 'edit', code });
      } else if (config.crudEntity === 'payrollEmployee') {
        payrollEmployeeNav.publishOpenIntent({ type: 'edit', code });
      }
      navigate(config.formNavKey);
    },
    [
      accountNav,
      config.crudEntity,
      config.formNavKey,
      hasApiCrud,
      navigate,
      openApiCrudEdit,
      payrollEmployeeNav,
      productNav,
    ],
  );

  const protectedActions = useProtectedMasterListActions(config, {
    setStatusMessage,
    onOpenNew: openNewFormCore,
    onOpenEdit: openEditFormCore,
  });

  const openNewForm = protectedActions.openNew;
  const openEditForm = useCallback(
    (record?: Record<string, unknown> | null) => {
      const target = record ?? selectedRecord;
      if (!target) return;
      void protectedActions.openEdit(target);
    },
    [protectedActions, selectedRecord],
  );

  const handleDelete = useCallback(
    async (record?: Record<string, unknown> | null) => {
      const target = record ?? selectedRecord;
      if (!target) return;
      const key = getRecordKey(target, config);
      const code = formatCellValue(target.code ?? target.username ?? target.employeeCode);
      const label = code || key;
      if (!label) return;

      const allowed = await protectedActions.authorizeDeleteRecord(target);
      if (!allowed) return;

      try {
        if (config.crudEntity === 'product') {
          await deleteProductByCode(code);
        } else if (config.crudEntity === 'account') {
          await deleteAccountByCode(code);
        } else if (config.crudEntity === 'payrollEmployee') {
          await deletePayrollEmployeeByCode(code);
        } else if (hasApiCrud) {
          await deleteMasterRecord(config.apiPath, key, config.crudKeyMode ?? 'by-code');
        } else {
          return;
        }
        setSelectedId(null);
        const name = formatCellValue(target.name ?? target.fullName ?? target.businessName);
        setStatusMessage(
          name
            ? `${config.moduleTitle ?? config.title}: "${name}" (${label}) was deleted.`
            : `Deleted ${label}.`,
        );
        await reload();
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Delete failed.');
      }
    },
    [config, hasApiCrud, protectedActions, reload, selectedRecord],
  );

  const openBomForRecord = useCallback(
    (record: Record<string, unknown>) => {
      if (!showBomAction) {
        setStatusMessage('You do not have permission to manage BOMs.');
        return;
      }
      const code = formatCellValue(record.code);
      if (code) {
        sessionStorage.setItem('ims.masterList.initialSearch.bom', code);
      }
      navigate('bom');
      setStatusMessage(code ? `Opening BOM list for ${code}…` : 'Opening BOM list…');
    },
    [navigate, showBomAction],
  );

  const listExport = useMasterListExportActions({
    config,
    canExport: protectedActions.canExport && showExport,
    search,
    rows: pageRecords,
    total,
    loading,
    setStatusMessage,
  });

  const columns = useMemo<DataGridColumn<MasterListRow>[]>(() => {
    const dataColumns: DataGridColumn<MasterListRow>[] = config.columns.map((col) => ({
      id: col.id,
      header: col.header,
      width: col.width ?? (col.minWidth ? '*' : undefined),
      minWidth: col.minWidth,
      readOnly: true,
      getValue: (row) => row[col.id] ?? '',
    }));
    if (!canMutate && !showBomAction) return dataColumns;
    if (!showEditDelete && !showBomAction) return dataColumns;
    return [
      createListActionColumn({
        rowLabel: masterRowLabel,
        onEdit: showEditDelete
          ? (row) => {
              const rec = recordForRow(row);
              if (rec) openEditForm(rec);
            }
          : () => {},
        onDelete: showEditDelete
          ? (row) => {
              const rec = recordForRow(row);
              if (rec) void handleDelete(rec);
            }
          : () => {},
        onBom: showBomAction
          ? (row) => {
              const rec = recordForRow(row);
              if (rec) openBomForRecord(rec);
            }
          : undefined,
        canEdit: showEditDelete && protectedActions.canEdit,
        canDelete: showEditDelete && protectedActions.canDelete,
        canBom: showBomAction,
        deleteTitle: 'Delete Selected',
      }),
      ...dataColumns,
    ];
  }, [
    canMutate,
    config.columns,
    handleDelete,
    masterRowLabel,
    openBomForRecord,
    openEditForm,
    protectedActions.canDelete,
    protectedActions.canEdit,
    recordForRow,
    showBomAction,
    showEditDelete,
  ]);

  const handleApiCrudSave = useCallback(
    async (payload: Record<string, unknown>) => {
      if (crudMode === 'new' && config.apiPath === 'users' && !payload.password) {
        setCrudError('Password is required for new users.');
        return;
      }

      setCrudSaving(true);
      setCrudError(null);
      try {
        const keyMode = config.crudKeyMode ?? 'by-code';
        if (crudMode === 'new') {
          await createMasterRecord(config.apiPath, payload);
        } else {
          await updateMasterRecord(config.apiPath, crudOriginalKey, payload, keyMode);
        }
        setCrudOpen(false);
        setSelectedId(null);
        if (config.apiPath === 'companies') {
          invalidateDefaultCompanyCache();
        }
        await reload();
      } catch (err) {
        setCrudError(err instanceof Error ? err.message : 'Save failed.');
      } finally {
        setCrudSaving(false);
      }
    },
    [config.apiPath, config.crudKeyMode, crudMode, crudOriginalKey, reload],
  );

  useListNewShortcut(canMutate && protectedActions.canAdd, openNewForm);

  return (
    <RefinedScreenShell className="sales-invoice-list-screen">
      <TransactionEntryShell title={config.title}>
        <div className="si-list-layout fv-list">
          <div className="si-list-toolbar">
            <div className="fv-list__toolbar si-list-toolbar__row">
              {canMutate && protectedActions.canAdd ? (
                <button type="button" className="wpf-action-button" onClick={openNewForm} title="Ctrl+N">
                  <span className="wpf-icontext" aria-hidden="true">
                    &#xE710;
                  </span>{' '}
                  {addActionLabel}
                </button>
              ) : null}
              {showEditDelete ? (
                <button
                  type="button"
                  className="wpf-action-button"
                  onClick={() => openEditForm()}
                  disabled={!selectedRecord || !protectedActions.canEdit}
                  title="Edit"
                >
                  Edit
                </button>
              ) : null}
              {showEditDelete ? (
                <button
                  type="button"
                  className="wpf-action-button si-list-toolbar__danger"
                  onClick={() => void handleDelete()}
                  disabled={!selectedRecord || !protectedActions.canDelete}
                  title="Delete Selected"
                >
                  Delete Selected
                </button>
              ) : null}
              <input
                className="wpf-form-input si-list-toolbar__search"
                placeholder={config.searchPlaceholder}
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
              />
              <button type="button" className="wpf-action-button" onClick={() => void reload()} disabled={loading}>
                Refresh
              </button>
              {showExport ? (
                <ListExportMenu
                  disabled={listExport.exportDisabled}
                  busy={listExport.exporting}
                  onExport={(format) => void listExport.runExport(format)}
                />
              ) : null}
            </div>
            {(error || !apiReady || statusMessage) ? (
              <p className="si-list-toolbar__status" role="status">
                {error ?? (!apiReady ? 'API offline' : statusMessage)}
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
                const record = recordForRow(row);
                if (record && canMutate && protectedActions.canEdit) openEditForm(record);
              }}
            />
          </ListGridArea>

          <TransactionListPagination
            page={page}
            pageSize={pageSize}
            totalPages={totalPages}
            totalRecords={total}
            loading={loading}
            onPageChange={setPage}
            onPageSizeChange={setPageSize}
          />
        </div>

        <MasterCrudDialog
          title={config.title}
          open={crudOpen}
          mode={crudMode}
          fields={crudDialogFields}
          initialValues={crudValues}
          saving={crudSaving}
          error={crudError}
          onClose={() => setCrudOpen(false)}
          onSave={(values) => void handleApiCrudSave(values)}
        />
      </TransactionEntryShell>
    </RefinedScreenShell>
  );
}
