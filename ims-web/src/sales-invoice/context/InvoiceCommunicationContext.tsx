import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import type { CommunicationChannel } from '../../types/communication';
import { InvoiceCommunicationDialog } from '../components/InvoiceCommunicationDialog';

interface PendingChoice {
  channels: CommunicationChannel[];
  sendByDefault: boolean;
  resolve: (choice: { send: boolean; channels: CommunicationChannel[] } | null) => void;
}

interface InvoiceCommunicationContextValue {
  requestChoice: (
    channels: CommunicationChannel[],
    sendByDefault: boolean,
  ) => Promise<{ send: boolean; channels: CommunicationChannel[] } | null>;
  showDeliverySummary: (summary: string, allOk: boolean, anyOk: boolean) => void;
}

const InvoiceCommunicationContext = createContext<InvoiceCommunicationContextValue | null>(null);

export function InvoiceCommunicationProvider({ children }: { children: ReactNode }) {
  const [pending, setPending] = useState<PendingChoice | null>(null);
  const [summary, setSummary] = useState<{
    text: string;
    tone: 'ok' | 'warn' | 'err';
  } | null>(null);

  const closePending = useCallback((choice: { send: boolean; channels: CommunicationChannel[] } | null) => {
    if (pending) pending.resolve(choice);
    setPending(null);
  }, [pending]);

  const requestChoice = useCallback(
    (channels: CommunicationChannel[], sendByDefault: boolean) =>
      new Promise<{ send: boolean; channels: CommunicationChannel[] } | null>((resolve) => {
        setSummary(null);
        setPending({ channels, sendByDefault, resolve });
      }),
    [],
  );

  const showDeliverySummary = useCallback((text: string, allOk: boolean, anyOk: boolean) => {
    const tone = allOk ? 'ok' : anyOk ? 'warn' : 'err';
    setSummary({ text, tone });
    window.setTimeout(() => setSummary(null), 8000);
  }, []);

  const value = useMemo(
    () => ({ requestChoice, showDeliverySummary }),
    [requestChoice, showDeliverySummary],
  );

  return (
    <InvoiceCommunicationContext.Provider value={value}>
      {children}
      <InvoiceCommunicationDialog
        open={Boolean(pending)}
        availableChannels={pending?.channels ?? []}
        sendByDefault={pending?.sendByDefault ?? true}
        onSend={(channels) => closePending({ send: true, channels })}
        onSkip={() => closePending(null)}
      />
      {summary ? (
        <div className="invoice-comm-overlay" role="presentation">
          <div className="invoice-comm-dialog" role="alertdialog" aria-live="polite">
            <h2 className="invoice-comm-dialog__title">
              {summary.tone === 'ok' ? 'Notifications Sent' : 'Notification Results'}
            </h2>
            <p
              className={`invoice-comm-dialog__summary invoice-comm-dialog__summary--${summary.tone}`}
            >
              {summary.text}
            </p>
            <div className="invoice-comm-dialog__actions">
              <button type="button" className="wpf-action-button" onClick={() => setSummary(null)}>
                OK
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </InvoiceCommunicationContext.Provider>
  );
}

export function useInvoiceCommunication(): InvoiceCommunicationContextValue {
  const ctx = useContext(InvoiceCommunicationContext);
  if (!ctx) {
    throw new Error('useInvoiceCommunication must be used within InvoiceCommunicationProvider');
  }
  return ctx;
}
