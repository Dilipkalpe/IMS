import { useCallback, useEffect, useMemo, useState } from 'react';
import { ApiError } from '../../api/client';
import {
  fetchGridColumnPreferences,
  resetGridColumnPreferences,
  saveGridColumnPreferences,
  type GridColumnDefinition,
} from '../../api/gridColumns';
import {
  clearLocalLineGridColumnKeys,
  filterEditableLineGridColumnIds,
  filterLineGridColumns,
  getDefaultVisibleLineGridKeys,
  getLineGridModuleTitle,
  isApiLineGridModule,
  loadLocalLineGridColumnKeys,
  normalizeVisibleLineGridKeys,
  saveLocalLineGridColumnKeys,
  TRANSACTION_LINE_GRID_COLUMNS,
  type TransactionLineGridModuleKey,
} from './transactionLineGridColumns';

const memoryCache = new Map<string, string[]>();
const listeners = new Set<(moduleKey: TransactionLineGridModuleKey) => void>();

function notifyPreferencesChanged(moduleKey: TransactionLineGridModuleKey) {
  for (const listener of listeners) listener(moduleKey);
}

function readCachedKeys(moduleKey: TransactionLineGridModuleKey): string[] | null {
  return memoryCache.get(moduleKey) ?? loadLocalLineGridColumnKeys(moduleKey);
}

function writeCachedKeys(moduleKey: TransactionLineGridModuleKey, keys: string[]) {
  const normalized = normalizeVisibleLineGridKeys(keys, moduleKey);
  memoryCache.set(moduleKey, normalized);
  saveLocalLineGridColumnKeys(moduleKey, normalized);
  notifyPreferencesChanged(moduleKey);
  return normalized;
}

async function loadPreferencesFromApi(moduleKey: TransactionLineGridModuleKey): Promise<{
  visibleKeys: string[];
  columns: GridColumnDefinition[];
  source: 'api' | 'local' | 'default';
  statusMessage: string;
}> {
  const defaults = getDefaultVisibleLineGridKeys(moduleKey);

  if (!isApiLineGridModule(moduleKey)) {
    const local = loadLocalLineGridColumnKeys(moduleKey);
    const visibleKeys = local ?? defaults;
    writeCachedKeys(moduleKey, visibleKeys);
    return {
      visibleKeys,
      columns: TRANSACTION_LINE_GRID_COLUMNS,
      source: local ? 'local' : 'default',
      statusMessage: local
        ? `${getLineGridModuleTitle(moduleKey)}: columns from browser storage (quotation is not on the API).`
        : `${getLineGridModuleTitle(moduleKey)}: default columns (quotation uses local storage only).`,
    };
  }

  try {
    const prefs = await fetchGridColumnPreferences(moduleKey);
    const visibleKeys = normalizeVisibleLineGridKeys(prefs.visibleColumnKeys, moduleKey);
    writeCachedKeys(moduleKey, visibleKeys);
    const sourceLabel = prefs.hasUserOverride
      ? 'your saved preferences'
      : prefs.hasGlobalDefault
        ? 'organization default'
        : 'system default';
    return {
      visibleKeys,
      columns: prefs.columns.length > 0 ? prefs.columns : TRANSACTION_LINE_GRID_COLUMNS,
      source: 'api',
      statusMessage: `${getLineGridModuleTitle(moduleKey)}: columns from ${sourceLabel}.`,
    };
  } catch (err) {
    const local = loadLocalLineGridColumnKeys(moduleKey);
    const visibleKeys = local ?? defaults;
    writeCachedKeys(moduleKey, visibleKeys);
    const offline =
      err instanceof ApiError && (err.status === 401 || err.status === 403)
        ? 'Sign in to sync column preferences with the server.'
        : 'API unavailable — using saved browser defaults.';
    return {
      visibleKeys,
      columns: TRANSACTION_LINE_GRID_COLUMNS,
      source: local ? 'local' : 'default',
      statusMessage: offline,
    };
  }
}

export interface UseTransactionLineGridColumnsOptions<T extends { id: string }> {
  moduleKey: TransactionLineGridModuleKey;
  isInterState: boolean;
  allColumns: T[];
  editableColumnIds?: readonly string[];
}

export function useTransactionLineGridColumns<T extends { id: string }>({
  moduleKey,
  isInterState,
  allColumns,
  editableColumnIds = [],
}: UseTransactionLineGridColumnsOptions<T>) {
  const [visibleKeys, setVisibleKeys] = useState<string[]>(
    () => readCachedKeys(moduleKey) ?? getDefaultVisibleLineGridKeys(moduleKey),
  );
  const [catalogColumns, setCatalogColumns] = useState<GridColumnDefinition[]>(
    TRANSACTION_LINE_GRID_COLUMNS,
  );
  const [statusMessage, setStatusMessage] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [isBusy, setIsBusy] = useState(false);

  const reload = useCallback(async () => {
    setIsBusy(true);
    try {
      const result = await loadPreferencesFromApi(moduleKey);
      setVisibleKeys(result.visibleKeys);
      setCatalogColumns(result.columns);
      setStatusMessage(result.statusMessage);
    } finally {
      setIsBusy(false);
    }
  }, [moduleKey]);

  useEffect(() => {
    void reload();
  }, [reload]);

  useEffect(() => {
    const onChanged = (changed: TransactionLineGridModuleKey) => {
      if (changed !== moduleKey) return;
      const cached = readCachedKeys(moduleKey);
      if (cached) setVisibleKeys(cached);
    };
    listeners.add(onChanged);
    return () => {
      listeners.delete(onChanged);
    };
  }, [moduleKey]);

  const visibleColumns = useMemo(
    () => filterLineGridColumns(allColumns, visibleKeys, isInterState, moduleKey),
    [allColumns, visibleKeys, isInterState, moduleKey],
  );

  const visibleEditableColumnIds = useMemo(
    () => filterEditableLineGridColumnIds(editableColumnIds, visibleColumns),
    [editableColumnIds, visibleColumns],
  );

  const openColumnSettings = useCallback(() => {
    setDialogOpen(true);
  }, []);

  const closeColumnSettings = useCallback(() => {
    setDialogOpen(false);
  }, []);

  const applyColumnSettings = useCallback(
    async (nextKeys: string[]) => {
      const normalized = normalizeVisibleLineGridKeys(nextKeys, moduleKey);
      setVisibleKeys(normalized);
      writeCachedKeys(moduleKey, normalized);
      setDialogOpen(false);

      if (!isApiLineGridModule(moduleKey)) {
        setStatusMessage(`${getLineGridModuleTitle(moduleKey)}: column visibility saved locally.`);
        return;
      }

      try {
        const prefs = await saveGridColumnPreferences(moduleKey, normalized);
        const saved = normalizeVisibleLineGridKeys(prefs.visibleColumnKeys, moduleKey);
        writeCachedKeys(moduleKey, saved);
        setVisibleKeys(saved);
        setCatalogColumns(prefs.columns.length > 0 ? prefs.columns : TRANSACTION_LINE_GRID_COLUMNS);
        setStatusMessage(`${getLineGridModuleTitle(moduleKey)}: column visibility saved.`);
      } catch (err) {
        const msg =
          err instanceof ApiError && (err.status === 401 || err.status === 403)
            ? 'Sign in required — column change saved in this browser only.'
            : 'Could not save to server — column change saved in this browser only.';
        setStatusMessage(msg);
      }
    },
    [moduleKey],
  );

  const resetColumnSettings = useCallback(async () => {
    if (!isApiLineGridModule(moduleKey)) {
      clearLocalLineGridColumnKeys(moduleKey);
      const defaults = getDefaultVisibleLineGridKeys(moduleKey);
      writeCachedKeys(moduleKey, defaults);
      setVisibleKeys(defaults);
      setStatusMessage(`${getLineGridModuleTitle(moduleKey)}: reset to default columns.`);
      return defaults;
    }

    try {
      const prefs = await resetGridColumnPreferences(moduleKey);
      clearLocalLineGridColumnKeys(moduleKey);
      const keys = normalizeVisibleLineGridKeys(prefs.visibleColumnKeys, moduleKey);
      writeCachedKeys(moduleKey, keys);
      setVisibleKeys(keys);
      setCatalogColumns(prefs.columns.length > 0 ? prefs.columns : TRANSACTION_LINE_GRID_COLUMNS);
      setStatusMessage(`${getLineGridModuleTitle(moduleKey)}: reset to default columns.`);
      return keys;
    } catch {
      clearLocalLineGridColumnKeys(moduleKey);
      const defaults = getDefaultVisibleLineGridKeys(moduleKey);
      writeCachedKeys(moduleKey, defaults);
      setVisibleKeys(defaults);
      setStatusMessage(`${getLineGridModuleTitle(moduleKey)}: reset to default columns (local).`);
      return defaults;
    }
  }, [moduleKey]);

  return {
    visibleColumns,
    visibleEditableColumnIds,
    visibleKeys,
    catalogColumns,
    statusMessage,
    dialogOpen,
    isBusy,
    openColumnSettings,
    closeColumnSettings,
    applyColumnSettings,
    resetColumnSettings,
    reload,
  };
}
