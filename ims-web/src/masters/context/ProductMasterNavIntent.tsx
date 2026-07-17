import { createContext, useCallback, useContext, useRef, type ReactNode } from 'react';

export type ProductMasterOpenIntent = { type: 'new' } | { type: 'edit'; code: string };

type IntentConsumer = (intent: ProductMasterOpenIntent) => void;

interface ProductMasterNavIntentContextValue {
  publishOpenIntent: (intent: ProductMasterOpenIntent) => void;
  consumeOpenIntent: (consumer: IntentConsumer) => () => void;
}

const ProductMasterNavIntentContext = createContext<ProductMasterNavIntentContextValue | null>(null);

export function ProductMasterNavIntentProvider({ children }: { children: ReactNode }) {
  const pendingRef = useRef<ProductMasterOpenIntent | null>(null);
  const consumerRef = useRef<IntentConsumer | null>(null);

  const publishOpenIntent = useCallback((intent: ProductMasterOpenIntent) => {
    pendingRef.current = intent;
    if (consumerRef.current) {
      const next = pendingRef.current;
      pendingRef.current = null;
      consumerRef.current(next);
    }
  }, []);

  const consumeOpenIntent = useCallback((consumer: IntentConsumer) => {
    consumerRef.current = consumer;
    if (pendingRef.current) {
      const next = pendingRef.current;
      pendingRef.current = null;
      consumer(next);
    }
    return () => {
      if (consumerRef.current === consumer) consumerRef.current = null;
    };
  }, []);

  return (
    <ProductMasterNavIntentContext.Provider value={{ publishOpenIntent, consumeOpenIntent }}>
      {children}
    </ProductMasterNavIntentContext.Provider>
  );
}

export function useProductMasterNavIntent() {
  const ctx = useContext(ProductMasterNavIntentContext);
  if (!ctx) throw new Error('ProductMasterNavIntentProvider is required.');
  return ctx;
}
