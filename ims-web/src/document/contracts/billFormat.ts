import type { BillFormatPrintSettings, BillFormatVisibilityRules, BillLayoutJson } from './billLayout';
import type { DocumentTypeKey } from './documentTypes';
import type { PrintableDocumentV1 } from './printableDocument';

/** Matches WPF / Mongo template keys (salesbilltemplates). */
export type BillFormatKey = 'standard' | 'thermal' | 'gst' | 'custom';

export const BILL_FORMAT_LABELS: Record<BillFormatKey, string> = {
  standard: 'Standard invoice',
  thermal: 'Thermal invoice',
  gst: 'GST invoice',
  custom: 'Custom (Bill Format Designer)',
};

export interface BillFormatSummary {
  formatKey: BillFormatKey;
  templateKey: string;
  name: string;
  description?: string;
  isDefault?: boolean;
  appliesToDocTypes: DocumentTypeKey[];
}

/** Resolved layout metadata for print/export. */
export interface BillFormatDefinition {
  formatKey: BillFormatKey;
  templateKey: string;
  name: string;
  layoutVersion: number;
  pageSizeKey: 'A4' | 'A5' | 'Thermal80' | 'Thermal58';
  printPreview: boolean;
  autoPrintAfterSave: boolean;
  layoutJson?: BillLayoutJson;
  visibilityRules?: BillFormatVisibilityRules;
  printSettings?: BillFormatPrintSettings;
  source?: 'api' | 'fallback';
}

export interface BillFormatResolveRequest {
  documentType: DocumentTypeKey;
  document: PrintableDocumentV1;
  partyAccountCode?: string;
  preferredFormatKey?: BillFormatKey;
}
