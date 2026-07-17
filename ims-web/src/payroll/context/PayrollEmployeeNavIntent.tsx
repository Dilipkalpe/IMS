import { createContext, useCallback, useContext, useRef, type ReactNode } from 'react';

export type PayrollEmployeeOpenIntent = { type: 'new' } | { type: 'edit'; code: string };

type IntentConsumer = (intent: PayrollEmployeeOpenIntent) => void;

interface PayrollEmployeeNavIntentContextValue {
  publishOpenIntent: (intent: PayrollEmployeeOpenIntent) => void;
  consumeOpenIntent: (consumer: IntentConsumer) => () => void;
}

const PayrollEmployeeNavIntentContext = createContext<PayrollEmployeeNavIntentContextValue | null>(null);

export function PayrollEmployeeNavIntentProvider({ children }: { children: ReactNode }) {
  const pendingRef = useRef<PayrollEmployeeOpenIntent | null>(null);
  const consumerRef = useRef<IntentConsumer | null>(null);

  const publishOpenIntent = useCallback((intent: PayrollEmployeeOpenIntent) => {
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
    <PayrollEmployeeNavIntentContext.Provider value={{ publishOpenIntent, consumeOpenIntent }}>
      {children}
    </PayrollEmployeeNavIntentContext.Provider>
  );
}

export function usePayrollEmployeeNavIntent() {
  const ctx = useContext(PayrollEmployeeNavIntentContext);
  if (!ctx) throw new Error('PayrollEmployeeNavIntentProvider is required.');
  return ctx;
}
