import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { formatLocaleNumber } from '../../utils/formatLocaleNumber';
import {
  columnFiltersToQuery,
  DEFAULT_LIST_PAGE_SIZE,
  EMPTY_COLUMN_FILTERS,
  LIST_SEARCH_DEBOUNCE_MS,
  totalListPages,
  type SortDirection,
  type TransactionListColumnFilters,
  type TransactionListQueryBase,
} from './transactionListQuery';

export interface TransactionListFetchRepository {
  readonly mode: 'http' | 'local';
  fetchList(query?: TransactionListQueryBase): Promise<{
    items: unknown[];
    total: number;
    page: number;
    limit: number;
  }>;
}

export interface UseTransactionListLoaderOptions<TRow extends { id: string }> {
  repository?: TransactionListFetchRepository | null;
  listVersion: number;
  mapRows: (items: unknown[], mode: 'http' | 'local') => TRow[];
  toSortField: (columnId: string) => string;
  defaultSortColumn?: string;
  defaultSortDir?: SortDirection;
  supportsColumnFilters?: boolean;
  docLabelPlural?: string;
}

export function useTransactionListLoader<TRow extends { id: string }>({
  repository,
  listVersion,
  mapRows,
  toSortField,
  defaultSortColumn = 'billNo',
  defaultSortDir = 'desc',
  supportsColumnFilters = false,
  docLabelPlural = 'record(s)',
}: UseTransactionListLoaderOptions<TRow>) {
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_LIST_PAGE_SIZE);
  const [sortColumn, setSortColumn] = useState(defaultSortColumn);
  const [sortDir, setSortDir] = useState<SortDirection>(defaultSortDir);
  const [columnFilters, setColumnFilters] = useState<TransactionListColumnFilters>(EMPTY_COLUMN_FILTERS);
  const [debouncedColumnFilters, setDebouncedColumnFilters] =
    useState<TransactionListColumnFilters>(EMPTY_COLUMN_FILTERS);
  const [rows, setRows] = useState<TRow[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [statusMessage, setStatusMessage] = useState('Loading…');
  const loadGenerationRef = useRef(0);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setSearch(searchInput.trim());
      setPage(1);
    }, LIST_SEARCH_DEBOUNCE_MS);
    return () => window.clearTimeout(timer);
  }, [searchInput]);

  useEffect(() => {
    if (!supportsColumnFilters) return;
    const timer = window.setTimeout(() => {
      setDebouncedColumnFilters(columnFilters);
      setPage(1);
    }, LIST_SEARCH_DEBOUNCE_MS);
    return () => window.clearTimeout(timer);
  }, [columnFilters, supportsColumnFilters]);

  const totalPages = useMemo(() => totalListPages(total, pageSize), [total, pageSize]);

  const loadList = useCallback(async () => {
    if (!repository) return;
    const generation = ++loadGenerationRef.current;
    setLoading(true);
    try {
      const query: TransactionListQueryBase = {
        search: search || undefined,
        status: statusFilter,
        page,
        limit: pageSize,
        sort: toSortField(sortColumn),
        sortDir,
        ...(supportsColumnFilters ? columnFiltersToQuery(debouncedColumnFilters) : {}),
      };

      const list = await repository.fetchList(query);
      if (generation !== loadGenerationRef.current) return;

      const mapped = mapRows(list.items, repository.mode);
      setRows(mapped);
      setTotal(list.total);

      const pageClamped = Math.min(page, totalListPages(list.total, pageSize));
      if (pageClamped !== page) setPage(pageClamped);

      setStatusMessage(
        (list.total ?? 0) === 0
          ? `No ${docLabelPlural} match your filters.`
          : `${formatLocaleNumber(list.total ?? 0)} ${docLabelPlural} found · page ${pageClamped} of ${totalListPages(list.total ?? 0, pageSize)} · ${repository.mode === 'http' ? 'API' : 'local store'}.`,
      );
    } catch (err) {
      if (generation !== loadGenerationRef.current) return;
      setStatusMessage(err instanceof Error ? err.message : 'Failed to load list.');
    } finally {
      if (generation === loadGenerationRef.current) setLoading(false);
    }
  }, [
    debouncedColumnFilters,
    docLabelPlural,
    mapRows,
    page,
    pageSize,
    repository,
    search,
    sortColumn,
    sortDir,
    statusFilter,
    supportsColumnFilters,
    toSortField,
  ]);

  useEffect(() => {
    if (repository) void loadList();
    else setStatusMessage('Connecting to store…');
  }, [loadList, listVersion, repository]);

  const handleSortColumn = useCallback((columnId: string) => {
    setPage(1);
    setSortColumn((prev) => {
      if (prev === columnId) {
        setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
        return prev;
      }
      setSortDir('asc');
      return columnId;
    });
  }, []);

  const setStatusFilterAndReset = useCallback((value: string) => {
    setStatusFilter(value);
    setPage(1);
  }, []);

  const setPageSizeAndReset = useCallback((value: number) => {
    setPageSize(value);
    setPage(1);
  }, []);

  const setColumnFilter = useCallback((key: keyof TransactionListColumnFilters, value: string) => {
    setColumnFilters((prev) => ({ ...prev, [key]: value }));
  }, []);

  const clearFilters = useCallback(() => {
    setSearchInput('');
    setSearch('');
    setStatusFilter('All');
    setColumnFilters(EMPTY_COLUMN_FILTERS);
    setPage(1);
  }, []);

  const hasActiveFilters =
    searchInput.trim().length > 0 ||
    (statusFilter !== 'All' && statusFilter !== '(All)') ||
    Object.values(columnFilters).some((v) => v.trim().length > 0);

  const setStatusMessageExternal = useCallback((message: string) => {
    setStatusMessage(message);
  }, []);

  const getExportQuery = useCallback((): Omit<TransactionListQueryBase, 'page' | 'limit'> => {
    return {
      search: search || undefined,
      status: statusFilter,
      sort: toSortField(sortColumn),
      sortDir,
      ...(supportsColumnFilters ? columnFiltersToQuery(debouncedColumnFilters) : {}),
    };
  }, [
    debouncedColumnFilters,
    search,
    sortColumn,
    sortDir,
    statusFilter,
    supportsColumnFilters,
    toSortField,
  ]);

  return {
    rows,
    total,
    loading,
    statusMessage,
    setStatusMessage: setStatusMessageExternal,
    searchInput,
    setSearchInput,
    statusFilter,
    setStatusFilter: setStatusFilterAndReset,
    page,
    setPage,
    pageSize,
    setPageSize: setPageSizeAndReset,
    totalPages,
    sortColumn,
    sortDir,
    handleSortColumn,
    columnFilters,
    setColumnFilter,
    supportsColumnFilters,
    clearFilters,
    hasActiveFilters,
    reload: loadList,
    getExportQuery,
  };
}
