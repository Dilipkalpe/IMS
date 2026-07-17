import { describe, expect, it } from 'vitest';
import type { InvoiceCommunicationContext } from '../../types/communication';
import {
  contextToPlaceholderMap,
  renderCommunicationTemplate,
  renderForDocument,
} from './communicationTemplate';
import { DEFAULT_COMMUNICATION_SETTINGS } from '../../types/communication';

const sampleContext: InvoiceCommunicationContext = {
  documentKind: 'sales_invoice',
  invoiceNumber: 'SI-1001',
  invoiceDate: '2026-06-06',
  partyName: 'Acme Corp',
  amount: '1500.00',
  balanceAmount: '500.00',
  companyName: 'IMS Company',
  contactDetails: 'GSTIN: 27AAAAA0000A1Z5',
};

describe('communicationTemplate', () => {
  it('replaces known placeholders', () => {
    const out = renderCommunicationTemplate(
      'Dear {{CustomerName}}, invoice {{InvoiceNumber}} for {{Amount}}.',
      contextToPlaceholderMap(sampleContext),
    );
    expect(out).toBe('Dear Acme Corp, invoice SI-1001 for 1500.00.');
  });

  it('leaves unknown placeholders intact', () => {
    const out = renderCommunicationTemplate('Hello {{Unknown}}', {});
    expect(out).toBe('Hello {{Unknown}}');
  });

  it('renders sales invoice template from settings', () => {
    const out = renderForDocument('sales_invoice', sampleContext, DEFAULT_COMMUNICATION_SETTINGS);
    expect(out).toContain('Acme Corp');
    expect(out).toContain('SI-1001');
    expect(out).toContain('1500.00');
    expect(out).toContain('500.00');
  });
});
