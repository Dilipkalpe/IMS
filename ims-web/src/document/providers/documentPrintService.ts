import type { BillFormatKey } from '../contracts/billFormat';
import type { DocumentTypeKey } from '../contracts/documentTypes';
import type { PrintableDocumentV1 } from '../contracts/printableDocument';
import type {
  DocumentActionKind,
  DocumentActionOutcome,
  ExportTarget,
  ListExportRequest,
} from '../contracts/printExportRequests';
import { enrichPrintableSeller } from '../utils/enrichPrintableSeller';
import type { DocumentPrintProviders } from './types';
import { apiDocumentPrintProviders } from './apiDocumentPrintProviders';

export const defaultDocumentPrintProviders: DocumentPrintProviders = apiDocumentPrintProviders;

export class DocumentPrintService {
  constructor(private readonly providers: DocumentPrintProviders = defaultDocumentPrintProviders) {}

  async resolveFormat(
    documentType: DocumentTypeKey,
    document: PrintableDocumentV1,
    preferredFormatKey?: BillFormatKey,
  ) {
    return this.providers.billFormatProvider.resolveFormat({
      documentType,
      document,
      partyAccountCode: document.buyer.accountCode,
      preferredFormatKey,
    });
  }

  async print(
    documentType: DocumentTypeKey,
    document: PrintableDocumentV1,
    options?: { showDialog?: boolean; formatKey?: BillFormatKey; targetWindow?: Window | null },
  ): Promise<DocumentActionOutcome> {
    const enriched = await enrichPrintableSeller(document);
    const format = await this.resolveFormat(documentType, enriched, options?.formatKey);
    const result = await this.providers.printProvider.print(
      {
        documentType,
        document: enriched,
        formatKey: format.formatKey,
        showDialog: options?.showDialog ?? true,
        targetWindow: options?.targetWindow,
      },
      format,
    );
    return { ok: result.ok, message: result.message, kind: 'print' };
  }

  async preview(
    documentType: DocumentTypeKey,
    document: PrintableDocumentV1,
    formatKey?: BillFormatKey,
  ): Promise<DocumentActionOutcome> {
    const enriched = await enrichPrintableSeller(document);
    const format = await this.resolveFormat(documentType, enriched, formatKey);
    const result = await this.providers.printProvider.preview(
      { documentType, document: enriched, formatKey: format.formatKey },
      format,
    );
    return { ok: result.ok, message: result.message, kind: 'preview' };
  }

  async export(
    documentType: DocumentTypeKey,
    document: PrintableDocumentV1,
    target: ExportTarget,
    formatKey?: BillFormatKey,
  ): Promise<DocumentActionOutcome> {
    const enriched = await enrichPrintableSeller(document);
    const format = await this.resolveFormat(documentType, enriched, formatKey);
    const kind: DocumentActionKind =
      target === 'pdf' ? 'export_pdf' : target === 'excel' ? 'export_excel' : 'export_csv';
    const result = await this.providers.exportProvider.exportDocument(
      { documentType, document: enriched, target, formatKey: format.formatKey },
      format,
    );
    return { ok: result.ok, message: result.message, kind };
  }

  async savePrintNext(
    documentType: DocumentTypeKey,
    document: PrintableDocumentV1,
    onSave: () => Promise<{ ok: boolean; message?: string }>,
  ): Promise<DocumentActionOutcome> {
    const save = await onSave();
    if (!save.ok) {
      return { ok: false, message: save.message ?? 'Save failed.', kind: 'save_print_next' };
    }
    const enriched = await enrichPrintableSeller(document);
    const format = await this.resolveFormat(documentType, enriched);
    const print = await this.providers.printProvider.print(
      { documentType, document: enriched, formatKey: format.formatKey, showDialog: false },
      format,
    );
    if (!print.ok) {
      return { ok: false, message: print.message, kind: 'save_print_next' };
    }
    return {
      ok: true,
      message: `${save.message ?? 'Saved.'} ${print.message}`,
      kind: 'save_print_next',
    };
  }

  async exportList(request: ListExportRequest): Promise<DocumentActionOutcome> {
    const result = await this.providers.exportProvider.exportList(request);
    return {
      ok: result.ok,
      message: result.message,
      kind: request.target === 'pdf' ? 'export_pdf' : request.target === 'excel' ? 'export_excel' : 'export_csv',
    };
  }
}

/** Singleton for app shell — swap providers when API/reporting is wired. */
export const documentPrintService = new DocumentPrintService();
