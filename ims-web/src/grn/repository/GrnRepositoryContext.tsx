import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { resolveGrnRepository } from './createGrnRepository';
import { getGrnListVersion, subscribeGrnList } from './listCache';
import type { GrnRepository } from './types';

interface GrnRepositoryContextValue {
  repository: GrnRepository | null;
  isReady: boolean;
  mode: 'http' | 'local' | null;
  listVersion: number;
}

const GrnRepositoryContext = createContext<GrnRepositoryContextValue>({
  repository: null,
  isReady: false,
  mode: null,
  listVersion: 0,
});

export function GrnRepositoryProvider({ children }: { children: ReactNode }) {
  const [repository, setRepository] = useState<GrnRepository | null>(null);
  const [listVersion, setListVersion] = useState(getGrnListVersion);

  useEffect(() => {
    let cancelled = false;
    resolveGrnRepository()
      .then((repo) => {
        if (!cancelled) setRepository(repo);
      })
      .catch(() => {
        /* repository stays null; screens show connecting state */
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => subscribeGrnList(() => setListVersion(getGrnListVersion())), []);

  const value = useMemo(
    (): GrnRepositoryContextValue => ({
      repository,
      isReady: repository != null,
      mode: repository?.mode ?? null,
      listVersion,
    }),
    [listVersion, repository],
  );

  return <GrnRepositoryContext.Provider value={value}>{children}</GrnRepositoryContext.Provider>;
}

export function useGrnRepository(): GrnRepository {
  const { repository, isReady } = useContext(GrnRepositoryContext);
  if (!isReady || !repository) {
    throw new Error('GrnRepository is not ready yet.');
  }
  return repository;
}

export function useGrnRepositoryOptional() {
  return useContext(GrnRepositoryContext);
}

export function useGrnListVersion(): number {
  return useContext(GrnRepositoryContext).listVersion;
}
