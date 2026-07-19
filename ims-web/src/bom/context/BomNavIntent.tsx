import { createContext, useCallback, useContext, useMemo, useRef, type ReactNode } from 'react';

export type BomNavIntent =
  | { type: 'new'; productCode?: string; returnNavKey?: string }
  | { type: 'edit'; productCode: string; returnNavKey?: string };

interface BomNavIntentContextValue {
  publishOpenIntent: (intent: BomNavIntent) => void;
  consumeOpenIntent: () => BomNavIntent | null;
}

const BomNavIntentContext = createContext<BomNavIntentContextValue | null>(null);

export function BomNavIntentProvider({ children }: { children: ReactNode }) {
  const intentRef = useRef<BomNavIntent | null>(null);

  const publishOpenIntent = useCallback((intent: BomNavIntent) => {
    intentRef.current = intent;
  }, []);

  const consumeOpenIntent = useCallback(() => {
    const intent = intentRef.current;
    intentRef.current = null;
    return intent;
  }, []);

  const value = useMemo(
    () => ({ publishOpenIntent, consumeOpenIntent }),
    [consumeOpenIntent, publishOpenIntent],
  );

  return <BomNavIntentContext.Provider value={value}>{children}</BomNavIntentContext.Provider>;
}

export function useBomNavIntent(): BomNavIntentContextValue {
  const ctx = useContext(BomNavIntentContext);
  if (!ctx) throw new Error('useBomNavIntent must be used within BomNavIntentProvider');
  return ctx;
}
