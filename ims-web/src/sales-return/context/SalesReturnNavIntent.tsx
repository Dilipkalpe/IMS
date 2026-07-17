import { createContext, useCallback, useContext, useRef, type ReactNode } from 'react';

export type SalesReturnOpenIntent =
  | { type: 'new' }
  | { type: 'edit'; documentId: string }
  | { type: 'editFormatted'; formatted: string };

type IntentConsumer = (intent: SalesReturnOpenIntent) => void;

const SalesReturnNavIntentContext = createContext<{
  publishOpenIntent: (intent: SalesReturnOpenIntent) => void;
  consumeOpenIntent: (consumer: IntentConsumer) => () => void;
} | null>(null);

export function SalesReturnNavIntentProvider({ children }: { children: ReactNode }) {
  const pendingRef = useRef<SalesReturnOpenIntent | null>(null);
  const consumerRef = useRef<IntentConsumer | null>(null);

  const publishOpenIntent = useCallback((intent: SalesReturnOpenIntent) => {
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
    <SalesReturnNavIntentContext.Provider value={{ publishOpenIntent, consumeOpenIntent }}>
      {children}
    </SalesReturnNavIntentContext.Provider>
  );
}

export function useSalesReturnNavIntent() {
  const ctx = useContext(SalesReturnNavIntentContext);
  if (!ctx) throw new Error('SalesReturnNavIntentProvider is required.');
  return ctx;
}
