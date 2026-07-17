import { createContext, useCallback, useContext, useRef, type ReactNode } from 'react';

export type QuotationOpenIntent =
  | { type: 'new' }
  | { type: 'edit'; documentId: string }
  | { type: 'editFormatted'; formatted: string };

type IntentConsumer = (intent: QuotationOpenIntent) => void;

const QuotationNavIntentContext = createContext<{
  publishOpenIntent: (intent: QuotationOpenIntent) => void;
  consumeOpenIntent: (consumer: IntentConsumer) => () => void;
} | null>(null);

export function QuotationNavIntentProvider({ children }: { children: ReactNode }) {
  const pendingRef = useRef<QuotationOpenIntent | null>(null);
  const consumerRef = useRef<IntentConsumer | null>(null);

  const publishOpenIntent = useCallback((intent: QuotationOpenIntent) => {
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
    <QuotationNavIntentContext.Provider value={{ publishOpenIntent, consumeOpenIntent }}>
      {children}
    </QuotationNavIntentContext.Provider>
  );
}

export function useQuotationNavIntent() {
  const ctx = useContext(QuotationNavIntentContext);
  if (!ctx) throw new Error('QuotationNavIntentProvider is required.');
  return ctx;
}
