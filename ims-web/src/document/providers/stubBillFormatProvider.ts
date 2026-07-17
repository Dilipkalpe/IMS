import type {
  BillFormatDefinition,
  BillFormatKey,
  BillFormatResolveRequest,
  BillFormatSummary,
} from '../contracts/billFormat';
import type { DocumentTypeKey } from '../contracts/documentTypes';
import type { BillFormatProvider } from './types';

const CATALOG: BillFormatSummary[] = [
  {
    formatKey: 'standard',
    templateKey: 'default',
    name: 'Standard invoice',
    isDefault: true,
    appliesToDocTypes: ['sales_invoice', 'sales_order', 'quotation', 'delivery_challan'],
  },
  {
    formatKey: 'thermal',
    templateKey: 'thermal',
    name: 'Thermal invoice',
    appliesToDocTypes: ['sales_invoice', 'sales_order', 'quotation'],
  },
  {
    formatKey: 'gst',
    templateKey: 'gst_invoice',
    name: 'GST invoice',
    appliesToDocTypes: ['sales_invoice', 'purchase_invoice'],
  },
  {
    formatKey: 'custom',
    templateKey: 'custom',
    name: 'Custom layout',
    description: 'Bill Format Designer (future API)',
    appliesToDocTypes: ['sales_invoice'],
  },
];

function toDefinition(summary: BillFormatSummary): BillFormatDefinition {
  const page =
    summary.formatKey === 'thermal'
      ? 'Thermal80'
      : summary.formatKey === 'gst'
        ? 'A4'
        : 'A4';
  return {
    formatKey: summary.formatKey,
    templateKey: summary.templateKey,
    name: summary.name,
    layoutVersion: 1,
    pageSizeKey: page,
    printPreview: true,
    autoPrintAfterSave: false,
  };
}

export const stubBillFormatProvider: BillFormatProvider = {
  name: 'stub-bill-format',

  async listFormats(documentType: DocumentTypeKey) {
    return CATALOG.filter((f) => f.appliesToDocTypes.includes(documentType));
  },

  async resolveFormat(request: BillFormatResolveRequest): Promise<BillFormatDefinition> {
    const { documentType, preferredFormatKey } = request;
    const match =
      (preferredFormatKey &&
        CATALOG.find((f) => f.formatKey === preferredFormatKey && f.appliesToDocTypes.includes(documentType))) ||
      CATALOG.find((f) => f.isDefault && f.appliesToDocTypes.includes(documentType)) ||
      CATALOG.find((f) => f.appliesToDocTypes.includes(documentType));
    return toDefinition(match ?? CATALOG[0]);
  },
};

export function billFormatKeyForDocumentType(docType: DocumentTypeKey): BillFormatKey {
  if (docType === 'sales_invoice' || docType === 'purchase_invoice') return 'gst';
  return 'standard';
}
