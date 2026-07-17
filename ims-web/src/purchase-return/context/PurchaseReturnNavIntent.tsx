import { createContext, useCallback, useContext, useRef, type ReactNode } from 'react';

export type PurchaseReturnOpenIntent =
  | { type: 'new' }
  | { type: 'edit'; documentId: string }
  | { type: 'editFormatted'; formatted: string };

type IntentConsumer = (intent: PurchaseReturnOpenIntent) => void;

const PurchaseReturnNavIntentContext = createContext<{
  publishOpenIntent: (intent: PurchaseReturnOpenIntent) => void;
  consumeOpenIntent: (consumer: IntentConsumer) => () => void;
} | null>(null);

export function PurchaseReturnNavIntentProvider({ children }: { children: ReactNode }) {
  const pendingRef = useRef<PurchaseReturnOpenIntent | null>(null);
  const consumerRef = useRef<IntentConsumer | null>(null);

  const publishOpenIntent = useCallback((intent: PurchaseReturnOpenIntent) => {
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
    <PurchaseReturnNavIntentContext.Provider value={{ publishOpenIntent, consumeOpenIntent }}>
      {children}
    </PurchaseReturnNavIntentContext.Provider>
  );
}

export function usePurchaseReturnNavIntent() {
  const ctx = useContext(PurchaseReturnNavIntentContext);
  if (!ctx) throw new Error('PurchaseReturnNavIntentProvider is required.');
  return ctx;
}
