import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { resolveQuotationRepository } from './createQuotationRepository';
import { getQuotationListVersion, subscribeQuotationList } from './listCache';
import type { QuotationRepository } from './types';

interface QuotationRepositoryContextValue {
  repository: QuotationRepository | null;
  isReady: boolean;
  mode: 'http' | 'local' | null;
  listVersion: number;
}

const QuotationRepositoryContext = createContext<QuotationRepositoryContextValue>({
  repository: null,
  isReady: false,
  mode: null,
  listVersion: 0,
});

export function QuotationRepositoryProvider({ children }: { children: ReactNode }) {
  const [repository, setRepository] = useState<QuotationRepository | null>(null);
  const [listVersion, setListVersion] = useState(getQuotationListVersion);

  useEffect(() => {
    let cancelled = false;
    resolveQuotationRepository().then((repo) => {
      if (!cancelled) setRepository(repo);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => subscribeQuotationList(() => setListVersion(getQuotationListVersion())), []);

  const value = useMemo(
    (): QuotationRepositoryContextValue => ({
      repository,
      isReady: repository != null,
      mode: repository?.mode ?? null,
      listVersion,
    }),
    [listVersion, repository],
  );

  return (
    <QuotationRepositoryContext.Provider value={value}>
      {children}
    </QuotationRepositoryContext.Provider>
  );
}

export function useQuotationRepository(): QuotationRepository {
  const { repository, isReady } = useContext(QuotationRepositoryContext);
  if (!isReady || !repository) {
    throw new Error('QuotationRepository is not ready yet.');
  }
  return repository;
}

export function useQuotationRepositoryOptional() {
  return useContext(QuotationRepositoryContext);
}

export function useQuotationListVersion(): number {
  return useContext(QuotationRepositoryContext).listVersion;
}
