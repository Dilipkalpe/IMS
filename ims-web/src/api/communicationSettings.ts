import type { CommunicationSettings } from '../types/communication';
import { DEFAULT_COMMUNICATION_SETTINGS } from '../types/communication';

const STORAGE_KEY = 'ims.communicationSettings';

let cached: CommunicationSettings | null = null;

function normalizeSettings(raw: Partial<CommunicationSettings> | null | undefined): CommunicationSettings {
  const base = DEFAULT_COMMUNICATION_SETTINGS;
  if (!raw || typeof raw !== 'object') return { ...base };

  return {
    disableAll: raw.disableAll === true,
    whatsAppEnabled: raw.whatsAppEnabled === true,
    smsEnabled: raw.smsEnabled === true,
    emailEnabled: raw.emailEnabled === true,
    promptBeforeSend: raw.promptBeforeSend !== false,
    sendAfterSaveByDefault: raw.sendAfterSaveByDefault !== false,
    whatsApp: { ...base.whatsApp, ...raw.whatsApp },
    sms: { ...base.sms, ...raw.sms },
    email: { ...base.email, ...raw.email },
    salesInvoiceTemplate: raw.salesInvoiceTemplate?.trim() || base.salesInvoiceTemplate,
    purchaseInvoiceTemplate: raw.purchaseInvoiceTemplate?.trim() || base.purchaseInvoiceTemplate,
  };
}

function readLocal(): CommunicationSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...DEFAULT_COMMUNICATION_SETTINGS };
    return normalizeSettings(JSON.parse(raw) as Partial<CommunicationSettings>);
  } catch {
    return { ...DEFAULT_COMMUNICATION_SETTINGS };
  }
}

/** WPF: CommunicationSettingsService — local storage until API exists. */
export async function getCommunicationSettings(): Promise<CommunicationSettings> {
  if (cached) return cached;
  cached = readLocal();
  return cached;
}

export function saveCommunicationSettings(settings: CommunicationSettings): void {
  cached = normalizeSettings(settings);
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(cached));
  } catch {
    // ignore
  }
}

export function clearCommunicationSettingsCache(): void {
  cached = null;
}

export function getEnabledChannels(settings: CommunicationSettings) {
  if (settings.disableAll) return [] as const;
  const channels: Array<'WhatsApp' | 'Sms' | 'Email'> = [];
  if (settings.whatsAppEnabled) channels.push('WhatsApp');
  if (settings.smsEnabled) channels.push('Sms');
  if (settings.emailEnabled) channels.push('Email');
  return channels;
}

export function hasAnyChannelEnabled(settings: CommunicationSettings): boolean {
  return getEnabledChannels(settings).length > 0;
}
