import { createContext, useCallback, useContext, useRef, type ReactNode } from 'react';

export type PurchaseInvoiceOpenIntent =
  | { type: 'new' }
  | { type: 'edit'; documentId: string }
  | { type: 'editFormatted'; formatted: string };

type IntentConsumer = (intent: PurchaseInvoiceOpenIntent) => void;

const PurchaseInvoiceNavIntentContext = createContext<{
  publishOpenIntent: (intent: PurchaseInvoiceOpenIntent) => void;
  consumeOpenIntent: (consumer: IntentConsumer) => () => void;
} | null>(null);

export function PurchaseInvoiceNavIntentProvider({ children }: { children: ReactNode }) {
  const pendingRef = useRef<PurchaseInvoiceOpenIntent | null>(null);
  const consumerRef = useRef<IntentConsumer | null>(null);

  const publishOpenIntent = useCallback((intent: PurchaseInvoiceOpenIntent) => {
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
    <PurchaseInvoiceNavIntentContext.Provider value={{ publishOpenIntent, consumeOpenIntent }}>
      {children}
    </PurchaseInvoiceNavIntentContext.Provider>
  );
}

export function usePurchaseInvoiceNavIntent() {
  const ctx = useContext(PurchaseInvoiceNavIntentContext);
  if (!ctx) throw new Error('PurchaseInvoiceNavIntentProvider is required.');
  return ctx;
}
