export type CommunicationChannel = 'WhatsApp' | 'Sms' | 'Email';

export type CommunicationDocumentKind = 'sales_invoice' | 'purchase_invoice';

export interface WhatsAppCommunicationSettings {
  apiUrl: string;
  apiKey: string;
  senderDetails: string;
}

export interface SmsCommunicationSettings {
  gatewayUrl: string;
  apiKey: string;
  senderId: string;
}

export interface EmailCommunicationSettings {
  smtpServer: string;
  smtpPort: number;
  emailAddress: string;
  password: string;
  useSsl: boolean;
}

export interface CommunicationSettings {
  disableAll: boolean;
  whatsAppEnabled: boolean;
  smsEnabled: boolean;
  emailEnabled: boolean;
  promptBeforeSend: boolean;
  sendAfterSaveByDefault: boolean;
  whatsApp: WhatsAppCommunicationSettings;
  sms: SmsCommunicationSettings;
  email: EmailCommunicationSettings;
  salesInvoiceTemplate: string;
  purchaseInvoiceTemplate: string;
}

export interface InvoiceCommunicationContext {
  documentKind: CommunicationDocumentKind;
  invoiceNumber: string;
  invoiceDate: string;
  partyName: string;
  partyEmail?: string;
  partyPhone?: string;
  amount: string;
  balanceAmount: string;
  companyName: string;
  contactDetails: string;
}

export interface InvoiceCommunicationChoice {
  send: boolean;
  channels: CommunicationChannel[];
}

export interface CommunicationDeliveryResult {
  channel: CommunicationChannel;
  recipient: string;
  success: boolean;
  errorMessage?: string;
}

export const DEFAULT_SALES_INVOICE_TEMPLATE =
  'Dear {{CustomerName}},\n\n' +
  'Invoice {{InvoiceNumber}} dated {{InvoiceDate}} for {{Amount}} has been saved.\n' +
  'Balance due: {{BalanceAmount}}.\n\n' +
  'Thank you,\n{{CompanyName}}\n{{ContactDetails}}';

export const DEFAULT_COMMUNICATION_SETTINGS: CommunicationSettings = {
  disableAll: false,
  whatsAppEnabled: false,
  smsEnabled: false,
  emailEnabled: false,
  promptBeforeSend: true,
  sendAfterSaveByDefault: true,
  whatsApp: { apiUrl: '', apiKey: '', senderDetails: '' },
  sms: { gatewayUrl: '', apiKey: '', senderId: '' },
  email: { smtpServer: '', smtpPort: 587, emailAddress: '', password: '', useSsl: true },
  salesInvoiceTemplate: DEFAULT_SALES_INVOICE_TEMPLATE,
  purchaseInvoiceTemplate:
    'Dear {{SupplierName}},\n\n' +
    'Purchase invoice {{InvoiceNumber}} dated {{InvoiceDate}} for {{Amount}} has been recorded.\n' +
    'Balance: {{BalanceAmount}}.\n\n' +
    'Regards,\n{{CompanyName}}\n{{ContactDetails}}',
};
