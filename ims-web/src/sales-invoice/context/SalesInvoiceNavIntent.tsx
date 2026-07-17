import { createContext, useCallback, useContext, useRef, type ReactNode } from 'react';

export type SalesInvoiceOpenIntent =
  | { type: 'new' }
  | { type: 'edit'; documentId: string }
  | { type: 'editFormatted'; formatted: string };

type IntentConsumer = (intent: SalesInvoiceOpenIntent) => void;

interface SalesInvoiceNavIntentContextValue {
  publishOpenIntent: (intent: SalesInvoiceOpenIntent) => void;
  consumeOpenIntent: (consumer: IntentConsumer) => () => void;
}

const SalesInvoiceNavIntentContext = createContext<SalesInvoiceNavIntentContextValue | null>(null);

export function SalesInvoiceNavIntentProvider({ children }: { children: ReactNode }) {
  const pendingRef = useRef<SalesInvoiceOpenIntent | null>(null);
  const consumerRef = useRef<IntentConsumer | null>(null);

  const publishOpenIntent = useCallback((intent: SalesInvoiceOpenIntent) => {
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
    <SalesInvoiceNavIntentContext.Provider value={{ publishOpenIntent, consumeOpenIntent }}>
      {children}
    </SalesInvoiceNavIntentContext.Provider>
  );
}

export function useSalesInvoiceNavIntent() {
  const ctx = useContext(SalesInvoiceNavIntentContext);
  if (!ctx) throw new Error('SalesInvoiceNavIntentProvider is required.');
  return ctx;
}
