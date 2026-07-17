import { createContext, useCallback, useContext, useRef, type ReactNode } from 'react';

export type DeliveryChallanOpenIntent =
  | { type: 'new' }
  | { type: 'edit'; documentId: string }
  | { type: 'editFormatted'; formatted: string };

type IntentConsumer = (intent: DeliveryChallanOpenIntent) => void;

const DeliveryChallanNavIntentContext = createContext<{
  publishOpenIntent: (intent: DeliveryChallanOpenIntent) => void;
  consumeOpenIntent: (consumer: IntentConsumer) => () => void;
} | null>(null);

export function DeliveryChallanNavIntentProvider({ children }: { children: ReactNode }) {
  const pendingRef = useRef<DeliveryChallanOpenIntent | null>(null);
  const consumerRef = useRef<IntentConsumer | null>(null);

  const publishOpenIntent = useCallback((intent: DeliveryChallanOpenIntent) => {
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
    <DeliveryChallanNavIntentContext.Provider value={{ publishOpenIntent, consumeOpenIntent }}>
      {children}
    </DeliveryChallanNavIntentContext.Provider>
  );
}

export function useDeliveryChallanNavIntent() {
  const ctx = useContext(DeliveryChallanNavIntentContext);
  if (!ctx) throw new Error('DeliveryChallanNavIntentProvider is required.');
  return ctx;
}
