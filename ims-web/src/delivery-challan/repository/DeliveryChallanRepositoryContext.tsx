import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { resolveDeliveryChallanRepository } from './createDeliveryChallanRepository';
import { getDeliveryChallanListVersion, subscribeDeliveryChallanList } from './listCache';
import type { DeliveryChallanRepository } from './types';

interface DeliveryChallanRepositoryContextValue {
  repository: DeliveryChallanRepository | null;
  isReady: boolean;
  mode: 'http' | 'local' | null;
  listVersion: number;
}

const DeliveryChallanRepositoryContext = createContext<DeliveryChallanRepositoryContextValue>({
  repository: null,
  isReady: false,
  mode: null,
  listVersion: 0,
});

export function DeliveryChallanRepositoryProvider({ children }: { children: ReactNode }) {
  const [repository, setRepository] = useState<DeliveryChallanRepository | null>(null);
  const [listVersion, setListVersion] = useState(getDeliveryChallanListVersion);

  useEffect(() => {
    let cancelled = false;
    resolveDeliveryChallanRepository().then((repo) => {
      if (!cancelled) setRepository(repo);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => subscribeDeliveryChallanList(() => setListVersion(getDeliveryChallanListVersion())), []);

  const value = useMemo(
    (): DeliveryChallanRepositoryContextValue => ({
      repository,
      isReady: repository != null,
      mode: repository?.mode ?? null,
      listVersion,
    }),
    [listVersion, repository],
  );

  return <DeliveryChallanRepositoryContext.Provider value={value}>{children}</DeliveryChallanRepositoryContext.Provider>;
}

export function useDeliveryChallanRepository(): DeliveryChallanRepository {
  const { repository, isReady } = useContext(DeliveryChallanRepositoryContext);
  if (!isReady || !repository) {
    throw new Error('DeliveryChallanRepository is not ready yet.');
  }
  return repository;
}

export function useDeliveryChallanRepositoryOptional() {
  return useContext(DeliveryChallanRepositoryContext);
}

export function useDeliveryChallanListVersion(): number {
  return useContext(DeliveryChallanRepositoryContext).listVersion;
}
