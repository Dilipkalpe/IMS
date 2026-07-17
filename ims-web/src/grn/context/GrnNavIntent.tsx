import { createContext, useCallback, useContext, useRef, type ReactNode } from 'react';

export type GrnOpenIntent =
  | { type: 'new' }
  | { type: 'edit'; documentId: string }
  | { type: 'editFormatted'; formatted: string };

type IntentConsumer = (intent: GrnOpenIntent) => void;

const GrnNavIntentContext = createContext<{
  publishOpenIntent: (intent: GrnOpenIntent) => void;
  consumeOpenIntent: (consumer: IntentConsumer) => () => void;
} | null>(null);

export function GrnNavIntentProvider({ children }: { children: ReactNode }) {
  const pendingRef = useRef<GrnOpenIntent | null>(null);
  const consumerRef = useRef<IntentConsumer | null>(null);

  const publishOpenIntent = useCallback((intent: GrnOpenIntent) => {
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
    <GrnNavIntentContext.Provider value={{ publishOpenIntent, consumeOpenIntent }}>
      {children}
    </GrnNavIntentContext.Provider>
  );
}

export function useGrnNavIntent() {
  const ctx = useContext(GrnNavIntentContext);
  if (!ctx) throw new Error('GrnNavIntentProvider is required.');
  return ctx;
}
