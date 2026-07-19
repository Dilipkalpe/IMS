import { createContext, useCallback, useContext, useMemo, useRef, type ReactNode } from 'react';

export type StockTransferNavIntent =
  | { type: 'new'; returnNavKey?: string }
  | { type: 'view'; entryNo: string; returnNavKey?: string };

interface StockTransferNavIntentContextValue {
  publishOpenIntent: (intent: StockTransferNavIntent) => void;
  consumeOpenIntent: () => StockTransferNavIntent | null;
}

const StockTransferNavIntentContext = createContext<StockTransferNavIntentContextValue | null>(null);

export function StockTransferNavIntentProvider({ children }: { children: ReactNode }) {
  const intentRef = useRef<StockTransferNavIntent | null>(null);

  const publishOpenIntent = useCallback((intent: StockTransferNavIntent) => {
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

  return (
    <StockTransferNavIntentContext.Provider value={value}>{children}</StockTransferNavIntentContext.Provider>
  );
}

export function useStockTransferNavIntent(): StockTransferNavIntentContextValue {
  const ctx = useContext(StockTransferNavIntentContext);
  if (!ctx) throw new Error('useStockTransferNavIntent must be used within StockTransferNavIntentProvider');
  return ctx;
}
