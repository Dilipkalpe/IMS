import type {
  CommunicationChannel,
  CommunicationDeliveryResult,
  CommunicationSettings,
  InvoiceCommunicationContext,
} from '../../types/communication';
import { renderForDocument } from './communicationTemplate';

const LOG_KEY = 'ims.communicationLog';

interface CommunicationLogEntry {
  timestamp: string;
  invoiceNumber: string;
  channel: CommunicationChannel;
  recipient: string;
  status: 'Success' | 'Failed';
  errorMessage?: string;
}

function appendLog(entry: CommunicationLogEntry): void {
  try {
    const raw = localStorage.getItem(LOG_KEY);
    const list = raw ? (JSON.parse(raw) as CommunicationLogEntry[]) : [];
    list.unshift(entry);
    localStorage.setItem(LOG_KEY, JSON.stringify(list.slice(0, 200)));
  } catch {
    // ignore
  }
}

function normalizePhone(phone?: string): string {
  if (!phone?.trim()) return '';
  const digits = phone.replace(/\D/g, '');
  return digits.length >= 10 ? digits : phone.trim();
}

function recipientFor(channel: CommunicationChannel, context: InvoiceCommunicationContext): string {
  return channel === 'Email' ? (context.partyEmail?.trim() ?? '') : normalizePhone(context.partyPhone);
}

/**
 * Client stub — WPF sends via HTTP/SMTP locally.
 * Validates settings + recipient; records intent in local communication log.
 */
export async function sendInvoiceCommunication(
  context: InvoiceCommunicationContext,
  channels: CommunicationChannel[],
  settings: CommunicationSettings,
): Promise<CommunicationDeliveryResult[]> {
  const message = renderForDocument(context.documentKind, context, settings);
  const results: CommunicationDeliveryResult[] = [];

  for (const channel of channels) {
    const recipient = recipientFor(channel, context);
    let result: CommunicationDeliveryResult;

    try {
      if (channel === 'WhatsApp') {
        if (!settings.whatsApp.apiUrl.trim()) {
          throw new Error('WhatsApp API URL is not configured in Settings.');
        }
        if (!recipient) throw new Error('Recipient mobile number is missing on the account master.');
      } else if (channel === 'Sms') {
        if (!settings.sms.gatewayUrl.trim()) {
          throw new Error('SMS gateway URL is not configured in Settings.');
        }
        if (!recipient) throw new Error('Recipient mobile number is missing on the account master.');
      } else if (channel === 'Email') {
        if (!settings.email.smtpServer.trim() || !settings.email.emailAddress.trim()) {
          throw new Error('SMTP settings are incomplete in Settings.');
        }
        if (!recipient) throw new Error('Recipient email is missing on the account master.');
      }

      // Stub delivery — no outbound API from browser.
      void message;
      result = { channel, recipient, success: true };
    } catch (err) {
      result = {
        channel,
        recipient,
        success: false,
        errorMessage: err instanceof Error ? err.message : 'Send failed.',
      };
    }

    results.push(result);
    appendLog({
      timestamp: new Date().toISOString(),
      invoiceNumber: context.invoiceNumber,
      channel: result.channel,
      recipient: result.recipient,
      status: result.success ? 'Success' : 'Failed',
      errorMessage: result.errorMessage,
    });
  }

  return results;
}

export function formatDeliverySummary(results: CommunicationDeliveryResult[]): string {
  if (results.length === 0) return '';
  return results
    .map((r) =>
      r.success
        ? `• ${r.channel}: Sent to ${r.recipient}`
        : `• ${r.channel}: Failed — ${r.errorMessage ?? 'Unknown error'}`,
    )
    .join('\n');
}
