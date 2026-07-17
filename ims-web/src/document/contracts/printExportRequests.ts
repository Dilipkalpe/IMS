import type { BillFormatKey } from './billFormat';
import type { DocumentTypeKey } from './documentTypes';
import type { PrintableDocumentV1 } from './printableDocument';

export type ExportTarget = 'pdf' | 'excel' | 'csv' | 'print_preview';

export interface PrintRequest {
  documentType: DocumentTypeKey;
  document: PrintableDocumentV1;
  formatKey?: BillFormatKey;
  showDialog?: boolean;
  copies?: number;
  /** Opened synchronously on user click; reused after async document load. */
  targetWindow?: Window | null;
}

export interface PrintResult {
  ok: boolean;
  message: string;
  jobId?: string;
}

export interface PreviewRequest {
  documentType: DocumentTypeKey;
  document: PrintableDocumentV1;
  formatKey?: BillFormatKey;
  targetWindow?: Window | null;
}

export interface PreviewResult {
  ok: boolean;
  message: string;
  /** Stub: HTML snapshot or blob URL for preview surface. */
  previewUrl?: string;
  previewHtml?: string;
}

export interface ExportRequest {
  documentType: DocumentTypeKey;
  document: PrintableDocumentV1;
  target: ExportTarget;
  formatKey?: BillFormatKey;
  fileName?: string;
}

export interface ExportResult {
  ok: boolean;
  message: string;
  fileName?: string;
  mimeType?: string;
  /** Stub: downloadable blob URL. */
  downloadUrl?: string;
}

/** List screen register export (StandardListView). */
export interface ListExportRequest {
  documentType: DocumentTypeKey;
  title: string;
  columns: { id: string; header: string }[];
  rows: Record<string, string | number>[];
  target: 'excel' | 'csv' | 'pdf';
}

export interface ListExportResult {
  ok: boolean;
  message: string;
  downloadUrl?: string;
  fileName?: string;
}

export type DocumentActionKind =
  | 'print'
  | 'preview'
  | 'export_pdf'
  | 'export_excel'
  | 'export_csv'
  | 'save_print_next';

export interface DocumentActionOutcome {
  ok: boolean;
  message: string;
  kind: DocumentActionKind;
}
