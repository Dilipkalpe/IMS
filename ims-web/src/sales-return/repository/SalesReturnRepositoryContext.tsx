import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { resolveSalesReturnRepository } from './createSalesReturnRepository';
import { getSalesReturnListVersion, subscribeSalesReturnList } from './listCache';
import type { SalesReturnRepository } from './types';

interface SalesReturnRepositoryContextValue {
  repository: SalesReturnRepository | null;
  isReady: boolean;
  mode: 'http' | 'local' | null;
  listVersion: number;
}

const SalesReturnRepositoryContext = createContext<SalesReturnRepositoryContextValue>({
  repository: null,
  isReady: false,
  mode: null,
  listVersion: 0,
});

export function SalesReturnRepositoryProvider({ children }: { children: ReactNode }) {
  const [repository, setRepository] = useState<SalesReturnRepository | null>(null);
  const [listVersion, setListVersion] = useState(getSalesReturnListVersion);

  useEffect(() => {
    let cancelled = false;
    resolveSalesReturnRepository().then((repo) => {
      if (!cancelled) setRepository(repo);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => subscribeSalesReturnList(() => setListVersion(getSalesReturnListVersion())), []);

  const value = useMemo(
    (): SalesReturnRepositoryContextValue => ({
      repository,
      isReady: repository != null,
      mode: repository?.mode ?? null,
      listVersion,
    }),
    [listVersion, repository],
  );

  return (
    <SalesReturnRepositoryContext.Provider value={value}>
      {children}
    </SalesReturnRepositoryContext.Provider>
  );
}

export function useSalesReturnRepository(): SalesReturnRepository {
  const { repository, isReady } = useContext(SalesReturnRepositoryContext);
  if (!isReady || !repository) {
    throw new Error('SalesReturnRepository is not ready yet.');
  }
  return repository;
}

export function useSalesReturnRepositoryOptional() {
  return useContext(SalesReturnRepositoryContext);
}

export function useSalesReturnListVersion(): number {
  return useContext(SalesReturnRepositoryContext).listVersion;
}
