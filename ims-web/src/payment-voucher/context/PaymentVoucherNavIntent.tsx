import { createContext, useCallback, useContext, useRef, type ReactNode } from 'react';
import type { InvoicePaymentSeed } from '../../types/invoicePaymentSeed';

export type PaymentVoucherOpenIntent =
  | { type: 'new'; returnNavKey?: string }
  | {
      type: 'invoicePayment';
      seed: InvoicePaymentSeed;
      returnNavKey: string;
      onPaymentRecorded?: () => void;
    }
  | {
      type: 'allocation';
      voucherNo?: number;
      accountCode?: string;
      accountName?: string;
      returnNavKey?: string;
    };

type IntentConsumer = (intent: PaymentVoucherOpenIntent) => void;

interface PaymentVoucherNavIntentContextValue {
  publishOpenIntent: (intent: PaymentVoucherOpenIntent) => void;
  consumeOpenIntent: (consumer: IntentConsumer) => () => void;
}

const PaymentVoucherNavIntentContext = createContext<PaymentVoucherNavIntentContextValue | null>(null);

export function PaymentVoucherNavIntentProvider({ children }: { children: ReactNode }) {
  const pendingRef = useRef<PaymentVoucherOpenIntent | null>(null);
  const consumerRef = useRef<IntentConsumer | null>(null);

  const publishOpenIntent = useCallback((intent: PaymentVoucherOpenIntent) => {
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
    <PaymentVoucherNavIntentContext.Provider value={{ publishOpenIntent, consumeOpenIntent }}>
      {children}
    </PaymentVoucherNavIntentContext.Provider>
  );
}

export function usePaymentVoucherNavIntent() {
  const ctx = useContext(PaymentVoucherNavIntentContext);
  if (!ctx) throw new Error('PaymentVoucherNavIntentProvider is required.');
  return ctx;
}
