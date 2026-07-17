import { createContext, useCallback, useContext, useRef, type ReactNode } from 'react';
import type { InvoicePaymentSeed } from '../../types/invoicePaymentSeed';

export type ReceiptVoucherOpenIntent =
  | { type: 'new'; returnNavKey?: string }
  | {
      type: 'invoicePayment';
      seed: InvoicePaymentSeed;
      returnNavKey: string;
      onPaymentRecorded?: () => void;
    }
  | { type: 'view'; voucherNo: number; returnNavKey?: string };

type IntentConsumer = (intent: ReceiptVoucherOpenIntent) => void;

interface ReceiptVoucherNavIntentContextValue {
  publishOpenIntent: (intent: ReceiptVoucherOpenIntent) => void;
  consumeOpenIntent: (consumer: IntentConsumer) => () => void;
}

const ReceiptVoucherNavIntentContext = createContext<ReceiptVoucherNavIntentContextValue | null>(null);

export function ReceiptVoucherNavIntentProvider({ children }: { children: ReactNode }) {
  const pendingRef = useRef<ReceiptVoucherOpenIntent | null>(null);
  const consumerRef = useRef<IntentConsumer | null>(null);

  const publishOpenIntent = useCallback((intent: ReceiptVoucherOpenIntent) => {
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
    <ReceiptVoucherNavIntentContext.Provider value={{ publishOpenIntent, consumeOpenIntent }}>
      {children}
    </ReceiptVoucherNavIntentContext.Provider>
  );
}

export function useReceiptVoucherNavIntent() {
  const ctx = useContext(ReceiptVoucherNavIntentContext);
  if (!ctx) throw new Error('ReceiptVoucherNavIntentProvider is required.');
  return ctx;
}
