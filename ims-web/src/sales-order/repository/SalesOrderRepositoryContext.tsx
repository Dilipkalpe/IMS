import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { resolveSalesOrderRepository } from './createSalesOrderRepository';
import { getSalesOrderListVersion, subscribeSalesOrderList } from './listCache';
import type { SalesOrderRepository } from './types';

interface SalesOrderRepositoryContextValue {
  repository: SalesOrderRepository | null;
  isReady: boolean;
  mode: 'http' | 'local' | null;
  listVersion: number;
}

const SalesOrderRepositoryContext = createContext<SalesOrderRepositoryContextValue>({
  repository: null,
  isReady: false,
  mode: null,
  listVersion: 0,
});

export function SalesOrderRepositoryProvider({ children }: { children: ReactNode }) {
  const [repository, setRepository] = useState<SalesOrderRepository | null>(null);
  const [listVersion, setListVersion] = useState(getSalesOrderListVersion);

  useEffect(() => {
    let cancelled = false;
    resolveSalesOrderRepository().then((repo) => {
      if (!cancelled) setRepository(repo);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => subscribeSalesOrderList(() => setListVersion(getSalesOrderListVersion())), []);

  const value = useMemo(
    (): SalesOrderRepositoryContextValue => ({
      repository,
      isReady: repository != null,
      mode: repository?.mode ?? null,
      listVersion,
    }),
    [listVersion, repository],
  );

  return (
    <SalesOrderRepositoryContext.Provider value={value}>
      {children}
    </SalesOrderRepositoryContext.Provider>
  );
}

export function useSalesOrderRepository(): SalesOrderRepository {
  const { repository, isReady } = useContext(SalesOrderRepositoryContext);
  if (!isReady || !repository) {
    throw new Error('SalesOrderRepository is not ready yet.');
  }
  return repository;
}

export function useSalesOrderRepositoryOptional() {
  return useContext(SalesOrderRepositoryContext);
}

export function useSalesOrderListVersion(): number {
  return useContext(SalesOrderRepositoryContext).listVersion;
}
