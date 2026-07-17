import type {
  BillFormatDefinition,
  BillFormatResolveRequest,
  BillFormatSummary,
} from '../contracts/billFormat';
import type { DocumentTypeKey } from '../contracts/documentTypes';
import type {
  ExportRequest,
  ExportResult,
  ListExportRequest,
  ListExportResult,
  PreviewRequest,
  PreviewResult,
  PrintRequest,
  PrintResult,
} from '../contracts/printExportRequests';

/** Physical / driver print (WPF PrintDialog / ReportPrintEngine). */
export interface PrintProvider {
  readonly name: string;
  print(request: PrintRequest, format: BillFormatDefinition): Promise<PrintResult>;
  preview(request: PreviewRequest, format: BillFormatDefinition): Promise<PreviewResult>;
}

/** Bill Format Master resolution (Mongo salesbilltemplates / designer). */
export interface BillFormatProvider {
  readonly name: string;
  listFormats(documentType: DocumentTypeKey): Promise<BillFormatSummary[]>;
  resolveFormat(request: BillFormatResolveRequest): Promise<BillFormatDefinition>;
}

/** PDF / Excel / CSV generation. */
export interface ExportProvider {
  readonly name: string;
  exportDocument(request: ExportRequest, format: BillFormatDefinition): Promise<ExportResult>;
  exportList(request: ListExportRequest): Promise<ListExportResult>;
}

export interface DocumentPrintProviders {
  printProvider: PrintProvider;
  billFormatProvider: BillFormatProvider;
  exportProvider: ExportProvider;
}
