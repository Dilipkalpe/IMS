import type { CommunicationDocumentKind, CommunicationSettings, InvoiceCommunicationContext } from '../../types/communication';

const PLACEHOLDER_RE = /\{\{\s*(\w+)\s*\}\}/g;

export function renderCommunicationTemplate(
  template: string,
  values: Record<string, string>,
): string {
  if (!template) return '';
  return template.replace(PLACEHOLDER_RE, (_m, key: string) => values[key] ?? _m);
}

export function contextToPlaceholderMap(context: InvoiceCommunicationContext): Record<string, string> {
  return {
    CustomerName: context.partyName,
    SupplierName: context.partyName,
    InvoiceNumber: context.invoiceNumber,
    InvoiceDate: context.invoiceDate,
    Amount: context.amount,
    BalanceAmount: context.balanceAmount,
    CompanyName: context.companyName,
    ContactDetails: context.contactDetails,
  };
}

export function renderForDocument(
  kind: CommunicationDocumentKind,
  context: InvoiceCommunicationContext,
  settings: CommunicationSettings,
): string {
  const template =
    kind === 'purchase_invoice'
      ? settings.purchaseInvoiceTemplate
      : settings.salesInvoiceTemplate;
  return renderCommunicationTemplate(template, contextToPlaceholderMap(context));
}
