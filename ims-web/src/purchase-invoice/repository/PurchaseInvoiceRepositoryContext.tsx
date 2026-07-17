import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { resolvePurchaseInvoiceRepository } from './createPurchaseInvoiceRepository';
import { getPurchaseListVersion, subscribePurchaseInvoiceList } from './listCache';
import type { PurchaseInvoiceRepository } from './types';

interface PurchaseInvoiceRepositoryContextValue {
  repository: PurchaseInvoiceRepository | null;
  isReady: boolean;
  mode: 'http' | 'local' | null;
  listVersion: number;
}

const PurchaseInvoiceRepositoryContext = createContext<PurchaseInvoiceRepositoryContextValue>({
  repository: null,
  isReady: false,
  mode: null,
  listVersion: 0,
});

export function PurchaseInvoiceRepositoryProvider({ children }: { children: ReactNode }) {
  const [repository, setRepository] = useState<PurchaseInvoiceRepository | null>(null);
  const [listVersion, setListVersion] = useState(getPurchaseListVersion);

  useEffect(() => {
    let cancelled = false;
    resolvePurchaseInvoiceRepository().then((repo) => {
      if (!cancelled) setRepository(repo);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => subscribePurchaseInvoiceList(() => setListVersion(getPurchaseListVersion())), []);

  const value = useMemo(
    (): PurchaseInvoiceRepositoryContextValue => ({
      repository,
      isReady: repository != null,
      mode: repository?.mode ?? null,
      listVersion,
    }),
    [listVersion, repository],
  );

  return (
    <PurchaseInvoiceRepositoryContext.Provider value={value}>
      {children}
    </PurchaseInvoiceRepositoryContext.Provider>
  );
}

export function usePurchaseInvoiceRepository(): PurchaseInvoiceRepository {
  const { repository, isReady } = useContext(PurchaseInvoiceRepositoryContext);
  if (!isReady || !repository) {
    throw new Error('PurchaseInvoiceRepository is not ready yet.');
  }
  return repository;
}

export function usePurchaseInvoiceRepositoryOptional() {
  return useContext(PurchaseInvoiceRepositoryContext);
}

export function usePurchaseInvoiceListVersion(): number {
  return useContext(PurchaseInvoiceRepositoryContext).listVersion;
}
