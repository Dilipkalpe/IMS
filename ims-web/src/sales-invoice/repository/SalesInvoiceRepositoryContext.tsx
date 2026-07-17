import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { resolveSalesInvoiceRepository } from './createSalesInvoiceRepository';
import { getListVersion, subscribeSalesInvoiceList } from './listCache';
import type { SalesInvoiceRepository } from './types';

interface SalesInvoiceRepositoryContextValue {
  repository: SalesInvoiceRepository | null;
  isReady: boolean;
  mode: 'http' | 'local' | null;
  listVersion: number;
  refreshListCache: () => void;
}

const SalesInvoiceRepositoryContext = createContext<SalesInvoiceRepositoryContextValue>({
  repository: null,
  isReady: false,
  mode: null,
  listVersion: 0,
  refreshListCache: () => undefined,
});

export function SalesInvoiceRepositoryProvider({ children }: { children: ReactNode }) {
  const [repository, setRepository] = useState<SalesInvoiceRepository | null>(null);
  const [listVersion, setListVersion] = useState(getListVersion);

  useEffect(() => {
    let cancelled = false;
    resolveSalesInvoiceRepository().then((repo) => {
      if (!cancelled) setRepository(repo);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => subscribeSalesInvoiceList(() => setListVersion(getListVersion())), []);

  const refreshListCache = useCallback(() => setListVersion(getListVersion()), []);

  const value = useMemo(
    (): SalesInvoiceRepositoryContextValue => ({
      repository,
      isReady: repository != null,
      mode: repository?.mode ?? null,
      listVersion,
      refreshListCache,
    }),
    [listVersion, refreshListCache, repository],
  );

  return (
    <SalesInvoiceRepositoryContext.Provider value={value}>{children}</SalesInvoiceRepositoryContext.Provider>
  );
}

export function useSalesInvoiceRepository(): SalesInvoiceRepository {
  const { repository, isReady } = useContext(SalesInvoiceRepositoryContext);
  if (!isReady || !repository) {
    throw new Error('SalesInvoiceRepository is not ready yet.');
  }
  return repository;
}

export function useSalesInvoiceRepositoryOptional() {
  return useContext(SalesInvoiceRepositoryContext);
}

export function useSalesInvoiceListVersion(): number {
  return useContext(SalesInvoiceRepositoryContext).listVersion;
}
