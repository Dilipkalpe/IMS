import { useCallback, useEffect, useState } from 'react';
import type { CommunicationChannel } from '../../types/communication';
import './InvoiceCommunicationDialog.scss';

export interface InvoiceCommunicationDialogProps {
  open: boolean;
  availableChannels: CommunicationChannel[];
  sendByDefault: boolean;
  onSend: (channels: CommunicationChannel[]) => void;
  onSkip: () => void;
}

/** WPF: InvoiceCommunicationWindow */
export function InvoiceCommunicationDialog({
  open,
  availableChannels,
  sendByDefault,
  onSend,
  onSkip,
}: InvoiceCommunicationDialogProps) {
  const [selected, setSelected] = useState<Record<CommunicationChannel, boolean>>({
    WhatsApp: sendByDefault,
    Sms: sendByDefault,
    Email: sendByDefault,
  });

  useEffect(() => {
    if (!open) return;
    setSelected({
      WhatsApp: sendByDefault && availableChannels.includes('WhatsApp'),
      Sms: sendByDefault && availableChannels.includes('Sms'),
      Email: sendByDefault && availableChannels.includes('Email'),
    });
  }, [availableChannels, open, sendByDefault]);

  const toggle = useCallback((channel: CommunicationChannel) => {
    setSelected((prev) => ({ ...prev, [channel]: !prev[channel] }));
  }, []);

  const submit = useCallback(() => {
    const channels = availableChannels.filter((c) => selected[c]);
    onSend(channels);
  }, [availableChannels, onSend, selected]);

  if (!open) return null;

  return (
    <div className="invoice-comm-overlay" role="presentation" onClick={onSkip}>
      <div
        className="invoice-comm-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="invoice-comm-title"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 id="invoice-comm-title" className="invoice-comm-dialog__title">
          Send notification after save?
        </h2>
        <p className="invoice-comm-dialog__desc">
          Choose which channels to use. Only services enabled in Settings are listed.
        </p>
        <div className="invoice-comm-dialog__channels">
          {availableChannels.length === 0 ? (
            <p className="invoice-comm-dialog__empty">
              No communication channels are enabled in Settings.
            </p>
          ) : (
            availableChannels.map((channel) => (
              <label key={channel} className="invoice-comm-dialog__channel">
                <input
                  type="checkbox"
                  checked={selected[channel]}
                  onChange={() => toggle(channel)}
                />
                {channel}
              </label>
            ))
          )}
        </div>
        <div className="invoice-comm-dialog__actions">
          <button type="button" className="wpf-action-button" onClick={onSkip}>
            Skip
          </button>
          <button
            type="button"
            className="wpf-action-button"
            onClick={submit}
            disabled={availableChannels.length === 0}
          >
            Send Now
          </button>
        </div>
      </div>
    </div>
  );
}
