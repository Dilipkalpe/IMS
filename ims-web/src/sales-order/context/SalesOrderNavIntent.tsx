import { createContext, useCallback, useContext, useRef, type ReactNode } from 'react';

export type SalesOrderOpenIntent =
  | { type: 'new' }
  | { type: 'edit'; documentId: string }
  | { type: 'editFormatted'; formatted: string };

type IntentConsumer = (intent: SalesOrderOpenIntent) => void;

const SalesOrderNavIntentContext = createContext<{
  publishOpenIntent: (intent: SalesOrderOpenIntent) => void;
  consumeOpenIntent: (consumer: IntentConsumer) => () => void;
} | null>(null);

export function SalesOrderNavIntentProvider({ children }: { children: ReactNode }) {
  const pendingRef = useRef<SalesOrderOpenIntent | null>(null);
  const consumerRef = useRef<IntentConsumer | null>(null);

  const publishOpenIntent = useCallback((intent: SalesOrderOpenIntent) => {
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
    <SalesOrderNavIntentContext.Provider value={{ publishOpenIntent, consumeOpenIntent }}>
      {children}
    </SalesOrderNavIntentContext.Provider>
  );
}

export function useSalesOrderNavIntent() {
  const ctx = useContext(SalesOrderNavIntentContext);
  if (!ctx) throw new Error('SalesOrderNavIntentProvider is required.');
  return ctx;
}
