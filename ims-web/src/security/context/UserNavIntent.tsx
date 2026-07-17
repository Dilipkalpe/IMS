import { createContext, useCallback, useContext, useRef, type ReactNode } from 'react';

export type UserOpenIntent = { type: 'new' } | { type: 'edit'; username: string };

type IntentConsumer = (intent: UserOpenIntent) => void;

interface UserNavIntentContextValue {
  publishOpenIntent: (intent: UserOpenIntent) => void;
  consumeOpenIntent: (consumer: IntentConsumer) => () => void;
}

const UserNavIntentContext = createContext<UserNavIntentContextValue | null>(null);

export function UserNavIntentProvider({ children }: { children: ReactNode }) {
  const pendingRef = useRef<UserOpenIntent | null>(null);
  const consumerRef = useRef<IntentConsumer | null>(null);

  const publishOpenIntent = useCallback((intent: UserOpenIntent) => {
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
    <UserNavIntentContext.Provider value={{ publishOpenIntent, consumeOpenIntent }}>
      {children}
    </UserNavIntentContext.Provider>
  );
}

export function useUserNavIntent() {
  const ctx = useContext(UserNavIntentContext);
  if (!ctx) throw new Error('UserNavIntentProvider is required.');
  return ctx;
}
