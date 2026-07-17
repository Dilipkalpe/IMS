import { createContext, useCallback, useContext, useRef, type ReactNode } from 'react';

export type RoleOpenIntent = { type: 'new' } | { type: 'edit'; id: string };

type IntentConsumer = (intent: RoleOpenIntent) => void;

interface RoleNavIntentContextValue {
  publishOpenIntent: (intent: RoleOpenIntent) => void;
  consumeOpenIntent: (consumer: IntentConsumer) => () => void;
}

const RoleNavIntentContext = createContext<RoleNavIntentContextValue | null>(null);

export function RoleNavIntentProvider({ children }: { children: ReactNode }) {
  const pendingRef = useRef<RoleOpenIntent | null>(null);
  const consumerRef = useRef<IntentConsumer | null>(null);

  const publishOpenIntent = useCallback((intent: RoleOpenIntent) => {
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
    <RoleNavIntentContext.Provider value={{ publishOpenIntent, consumeOpenIntent }}>
      {children}
    </RoleNavIntentContext.Provider>
  );
}

export function useRoleNavIntent() {
  const ctx = useContext(RoleNavIntentContext);
  if (!ctx) throw new Error('RoleNavIntentProvider is required.');
  return ctx;
}
