import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { fetchCustomerAccountNames } from '../../api/accounts';
import { probeApiHealth } from '../../api/client';
import {
  buildValidCustomerNameSet,
  OFFLINE_CUSTOMER_NAMES_FALLBACK,
} from './salesCustomerPicker';

interface SalesCustomerPickerContextValue {
  customers: readonly string[];
  validCustomerNames: Set<string>;
  loading: boolean;
  source: 'api' | 'offline';
  reload: () => Promise<void>;
}

const SalesCustomerPickerContext = createContext<SalesCustomerPickerContextValue | null>(null);

export function SalesCustomerPickerProvider({ children }: { children: ReactNode }) {
  const [customers, setCustomers] = useState<readonly string[]>(OFFLINE_CUSTOMER_NAMES_FALLBACK);
  const [loading, setLoading] = useState(true);
  const [source, setSource] = useState<'api' | 'offline'>('offline');

  const reload = useCallback(async () => {
    setLoading(true);
    try {
      const apiUp = await probeApiHealth();
      if (!apiUp) {
        setCustomers(OFFLINE_CUSTOMER_NAMES_FALLBACK);
        setSource('offline');
        return;
      }
      const names = await fetchCustomerAccountNames();
      if (names.length > 0) {
        setCustomers(names);
        setSource('api');
      } else {
        setCustomers(OFFLINE_CUSTOMER_NAMES_FALLBACK);
        setSource('offline');
      }
    } catch {
      setCustomers(OFFLINE_CUSTOMER_NAMES_FALLBACK);
      setSource('offline');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  const validCustomerNames = useMemo(() => buildValidCustomerNameSet(customers), [customers]);

  const value = useMemo(
    (): SalesCustomerPickerContextValue => ({
      customers,
      validCustomerNames,
      loading,
      source,
      reload,
    }),
    [customers, validCustomerNames, loading, source, reload],
  );

  return (
    <SalesCustomerPickerContext.Provider value={value}>{children}</SalesCustomerPickerContext.Provider>
  );
}

export function useSalesCustomerPicker(): SalesCustomerPickerContextValue {
  const ctx = useContext(SalesCustomerPickerContext);
  if (!ctx) {
    throw new Error('useSalesCustomerPicker requires SalesCustomerPickerProvider.');
  }
  return ctx;
}
