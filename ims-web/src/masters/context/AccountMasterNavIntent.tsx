import { createContext, useCallback, useContext, useRef, type ReactNode } from 'react';

export type AccountMasterOpenIntent =
  | { type: 'new'; accountType?: 'customer' | 'supplier' }
  | { type: 'edit'; code: string };

type IntentConsumer = (intent: AccountMasterOpenIntent) => void;

interface AccountMasterNavIntentContextValue {
  publishOpenIntent: (intent: AccountMasterOpenIntent) => void;
  consumeOpenIntent: (consumer: IntentConsumer) => () => void;
}

const AccountMasterNavIntentContext = createContext<AccountMasterNavIntentContextValue | null>(null);

export function AccountMasterNavIntentProvider({ children }: { children: ReactNode }) {
  const pendingRef = useRef<AccountMasterOpenIntent | null>(null);
  const consumerRef = useRef<IntentConsumer | null>(null);

  const publishOpenIntent = useCallback((intent: AccountMasterOpenIntent) => {
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
    <AccountMasterNavIntentContext.Provider value={{ publishOpenIntent, consumeOpenIntent }}>
      {children}
    </AccountMasterNavIntentContext.Provider>
  );
}

export function useAccountMasterNavIntent() {
  const ctx = useContext(AccountMasterNavIntentContext);
  if (!ctx) throw new Error('AccountMasterNavIntentProvider is required.');
  return ctx;
}
