import { createContext, useCallback, useContext, useRef, type ReactNode } from 'react';

export type PurchaseOrderOpenIntent =
  | { type: 'new' }
  | { type: 'edit'; documentId: string }
  | { type: 'editFormatted'; formatted: string };

type IntentConsumer = (intent: PurchaseOrderOpenIntent) => void;

const PurchaseOrderNavIntentContext = createContext<{
  publishOpenIntent: (intent: PurchaseOrderOpenIntent) => void;
  consumeOpenIntent: (consumer: IntentConsumer) => () => void;
} | null>(null);

export function PurchaseOrderNavIntentProvider({ children }: { children: ReactNode }) {
  const pendingRef = useRef<PurchaseOrderOpenIntent | null>(null);
  const consumerRef = useRef<IntentConsumer | null>(null);

  const publishOpenIntent = useCallback((intent: PurchaseOrderOpenIntent) => {
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
    <PurchaseOrderNavIntentContext.Provider value={{ publishOpenIntent, consumeOpenIntent }}>
      {children}
    </PurchaseOrderNavIntentContext.Provider>
  );
}

export function usePurchaseOrderNavIntent() {
  const ctx = useContext(PurchaseOrderNavIntentContext);
  if (!ctx) throw new Error('PurchaseOrderNavIntentProvider is required.');
  return ctx;
}
