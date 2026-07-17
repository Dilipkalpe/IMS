import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { resolvePurchaseOrderRepository } from './createPurchaseOrderRepository';
import { getPurchaseOrderListVersion, subscribePurchaseOrderList } from './listCache';
import type { PurchaseOrderRepository } from './types';

interface PurchaseOrderRepositoryContextValue {
  repository: PurchaseOrderRepository | null;
  isReady: boolean;
  mode: 'http' | 'local' | null;
  listVersion: number;
}

const PurchaseOrderRepositoryContext = createContext<PurchaseOrderRepositoryContextValue>({
  repository: null,
  isReady: false,
  mode: null,
  listVersion: 0,
});

export function PurchaseOrderRepositoryProvider({ children }: { children: ReactNode }) {
  const [repository, setRepository] = useState<PurchaseOrderRepository | null>(null);
  const [listVersion, setListVersion] = useState(getPurchaseOrderListVersion);

  useEffect(() => {
    let cancelled = false;
    resolvePurchaseOrderRepository().then((repo) => {
      if (!cancelled) setRepository(repo);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => subscribePurchaseOrderList(() => setListVersion(getPurchaseOrderListVersion())), []);

  const value = useMemo(
    (): PurchaseOrderRepositoryContextValue => ({
      repository,
      isReady: repository != null,
      mode: repository?.mode ?? null,
      listVersion,
    }),
    [listVersion, repository],
  );

  return (
    <PurchaseOrderRepositoryContext.Provider value={value}>
      {children}
    </PurchaseOrderRepositoryContext.Provider>
  );
}

export function usePurchaseOrderRepository(): PurchaseOrderRepository {
  const { repository, isReady } = useContext(PurchaseOrderRepositoryContext);
  if (!isReady || !repository) {
    throw new Error('PurchaseOrderRepository is not ready yet.');
  }
  return repository;
}

export function usePurchaseOrderRepositoryOptional() {
  return useContext(PurchaseOrderRepositoryContext);
}

export function usePurchaseOrderListVersion(): number {
  return useContext(PurchaseOrderRepositoryContext).listVersion;
}
