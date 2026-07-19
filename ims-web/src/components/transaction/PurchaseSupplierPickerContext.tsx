import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { fetchSupplierAccountNames } from '../../api/accounts';
import { probeApiHealth } from '../../api/client';
import {
  buildValidSupplierNameSet,
  OFFLINE_SUPPLIER_NAMES_FALLBACK,
} from './purchaseSupplierPicker';

interface PurchaseSupplierPickerContextValue {
  suppliers: readonly string[];
  validSupplierNames: Set<string>;
  loading: boolean;
  source: 'api' | 'offline';
  reload: () => Promise<void>;
}

const PurchaseSupplierPickerContext = createContext<PurchaseSupplierPickerContextValue | null>(null);

export function PurchaseSupplierPickerProvider({ children }: { children: ReactNode }) {
  const [suppliers, setSuppliers] = useState<readonly string[]>(OFFLINE_SUPPLIER_NAMES_FALLBACK);
  const [loading, setLoading] = useState(true);
  const [source, setSource] = useState<'api' | 'offline'>('offline');

  const reload = useCallback(async () => {
    setLoading(true);
    try {
      const apiUp = await probeApiHealth();
      if (!apiUp) {
        setSuppliers(OFFLINE_SUPPLIER_NAMES_FALLBACK);
        setSource('offline');
        return;
      }
      const names = await fetchSupplierAccountNames();
      if (names.length > 0) {
        setSuppliers(names);
        setSource('api');
      } else {
        setSuppliers(OFFLINE_SUPPLIER_NAMES_FALLBACK);
        setSource('offline');
      }
    } catch {
      setSuppliers(OFFLINE_SUPPLIER_NAMES_FALLBACK);
      setSource('offline');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  const validSupplierNames = useMemo(() => buildValidSupplierNameSet(suppliers), [suppliers]);

  const value = useMemo(
    (): PurchaseSupplierPickerContextValue => ({
      suppliers,
      validSupplierNames,
      loading,
      source,
      reload,
    }),
    [suppliers, validSupplierNames, loading, source, reload],
  );

  return (
    <PurchaseSupplierPickerContext.Provider value={value}>{children}</PurchaseSupplierPickerContext.Provider>
  );
}

export function usePurchaseSupplierPicker(): PurchaseSupplierPickerContextValue {
  const ctx = useContext(PurchaseSupplierPickerContext);
  if (!ctx) {
    throw new Error('usePurchaseSupplierPicker requires PurchaseSupplierPickerProvider.');
  }
  return ctx;
}
