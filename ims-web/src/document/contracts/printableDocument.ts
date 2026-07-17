import type { DocumentTypeKey } from './documentTypes';

/** Versioned printable payload — independent of React UI state. */
export const PRINTABLE_DOCUMENT_SCHEMA_VERSION = 1 as const;

export type PrintableDocumentSchemaVersion = typeof PRINTABLE_DOCUMENT_SCHEMA_VERSION;

export interface PrintablePartyV1 {
  name: string;
  accountCode?: string;
  gstin?: string;
  address?: string;
  logoImage?: string;
  logoText?: string;
}

export interface PrintableLineV1 {
  lineNo: number;
  productCode: string;
  description: string;
  qty: number;
  rate: number;
  salesRate: number;
  discPercent: number;
  taxable: number;
  cgstPercent: number;
  cgstAmount: number;
  sgstPercent: number;
  sgstAmount: number;
  igstPercent: number;
  igstAmount: number;
  lineTotal: number;
}

export interface PrintableTotalsV1 {
  totalTaxable: number;
  totalCgst: number;
  totalSgst: number;
  totalIgst: number;
  totalDiscount: number;
  invoiceTotal: number;
  paidAmount: number;
  balanceDue: number;
  roundOff: number;
}

export interface PrintableDocumentHeaderV1 {
  docPrefix: string;
  docNo: string;
  formattedDocNo: string;
  documentDate: string;
  dueDate?: string;
  reference?: string;
  paymentType?: string;
  paymentMode?: string;
  narration?: string;
  status?: string;
}

export interface PrintableDocumentV1 {
  schemaVersion: PrintableDocumentSchemaVersion;
  documentType: DocumentTypeKey;
  /** Server id when persisted; omitted for new/unsaved docs. */
  documentId?: string;
  header: PrintableDocumentHeaderV1;
  seller: PrintablePartyV1;
  buyer: PrintablePartyV1;
  placeOfSupply: string;
  lines: PrintableLineV1[];
  totals: PrintableTotalsV1;
  /** ISO timestamp when payload was built (client). */
  generatedAt: string;
}
