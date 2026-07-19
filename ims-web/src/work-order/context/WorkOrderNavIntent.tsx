import { createContext, useCallback, useContext, useRef, type ReactNode } from 'react';

export type WorkOrderOpenIntent =
  | { type: 'new'; returnNavKey?: string }
  | { type: 'edit'; productionNo: number; returnNavKey?: string };

type IntentConsumer = (intent: WorkOrderOpenIntent) => void;

interface WorkOrderNavIntentContextValue {
  publishOpenIntent: (intent: WorkOrderOpenIntent) => void;
  consumeOpenIntent: (consumer: IntentConsumer) => () => void;
}

const WorkOrderNavIntentContext = createContext<WorkOrderNavIntentContextValue | null>(null);

export function WorkOrderNavIntentProvider({ children }: { children: ReactNode }) {
  const pendingRef = useRef<WorkOrderOpenIntent | null>(null);
  const consumerRef = useRef<IntentConsumer | null>(null);

  const publishOpenIntent = useCallback((intent: WorkOrderOpenIntent) => {
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
    <WorkOrderNavIntentContext.Provider value={{ publishOpenIntent, consumeOpenIntent }}>
      {children}
    </WorkOrderNavIntentContext.Provider>
  );
}

export function useWorkOrderNavIntent() {
  const ctx = useContext(WorkOrderNavIntentContext);
  if (!ctx) throw new Error('WorkOrderNavIntentProvider is required.');
  return ctx;
}
