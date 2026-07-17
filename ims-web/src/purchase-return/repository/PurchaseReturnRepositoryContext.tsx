import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { resolvePurchaseReturnRepository } from './createPurchaseReturnRepository';
import { getPurchaseReturnListVersion, subscribePurchaseReturnList } from './listCache';
import type { PurchaseReturnRepository } from './types';

interface PurchaseReturnRepositoryContextValue {
  repository: PurchaseReturnRepository | null;
  isReady: boolean;
  mode: 'http' | 'local' | null;
  listVersion: number;
}

const PurchaseReturnRepositoryContext = createContext<PurchaseReturnRepositoryContextValue>({
  repository: null,
  isReady: false,
  mode: null,
  listVersion: 0,
});

export function PurchaseReturnRepositoryProvider({ children }: { children: ReactNode }) {
  const [repository, setRepository] = useState<PurchaseReturnRepository | null>(null);
  const [listVersion, setListVersion] = useState(getPurchaseReturnListVersion);

  useEffect(() => {
    let cancelled = false;
    resolvePurchaseReturnRepository().then((repo) => {
      if (!cancelled) setRepository(repo);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => subscribePurchaseReturnList(() => setListVersion(getPurchaseReturnListVersion())), []);

  const value = useMemo(
    (): PurchaseReturnRepositoryContextValue => ({
      repository,
      isReady: repository != null,
      mode: repository?.mode ?? null,
      listVersion,
    }),
    [listVersion, repository],
  );

  return (
    <PurchaseReturnRepositoryContext.Provider value={value}>
      {children}
    </PurchaseReturnRepositoryContext.Provider>
  );
}

export function usePurchaseReturnRepository(): PurchaseReturnRepository {
  const { repository, isReady } = useContext(PurchaseReturnRepositoryContext);
  if (!isReady || !repository) {
    throw new Error('PurchaseReturnRepository is not ready yet.');
  }
  return repository;
}

export function usePurchaseReturnRepositoryOptional() {
  return useContext(PurchaseReturnRepositoryContext);
}

export function usePurchaseReturnListVersion(): number {
  return useContext(PurchaseReturnRepositoryContext).listVersion;
}
