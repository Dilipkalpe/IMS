import type { BillFormatDefinition } from '../contracts/billFormat';
import type {
  ExportRequest,
  ExportResult,
  ListExportRequest,
  ListExportResult,
} from '../contracts/printExportRequests';
import {
  buildListPrintHtml,
  downloadTextFile,
  exportListToCsv,
  exportListToExcelCsv,
  timestampedFileName,
} from '../../components/transaction/listExport';
import type { ExportProvider } from './types';
import { renderPrintableDocumentHtml } from './stubPrintRenderer';

function downloadBlob(blob: Blob, fileName: string): string {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 60_000);
  return url;
}

function linesToCsv(document: ExportRequest['document']): string {
  const headers = [
    'Sr',
    'Code',
    'Description',
    'Qty',
    'Rate',
    'Taxable',
    'CGST Amt',
    'SGST Amt',
    'IGST Amt',
    'Line Total',
  ];
  const rows = document.lines.map((l) =>
    [
      l.lineNo,
      l.productCode,
      `"${l.description.replace(/"/g, '""')}"`,
      l.qty,
      l.rate,
      l.taxable,
      l.cgstAmount,
      l.sgstAmount,
      l.igstAmount,
      l.lineTotal,
    ].join(','),
  );
  return [headers.join(','), ...rows].join('\n');
}

export const stubExportProvider: ExportProvider = {
  name: 'stub-export',

  async exportDocument(request: ExportRequest, format: BillFormatDefinition): Promise<ExportResult> {
    const base =
      request.fileName ??
      `${request.document.header.formattedDocNo || request.documentType}`.replace(/[^\w-]+/g, '_');

    if (request.target === 'csv' || request.target === 'excel') {
      const csv = linesToCsv(request.document);
      const ext = request.target === 'excel' ? 'csv' : 'csv';
      const fileName = `${base}.${ext}`;
      const url = downloadBlob(new Blob([csv], { type: 'text/csv;charset=utf-8' }), fileName);
      return {
        ok: true,
        message: `Exported ${fileName} (${format.name}, stub CSV).`,
        fileName,
        mimeType: 'text/csv',
        downloadUrl: url,
      };
    }

    if (request.target === 'pdf') {
      const html = renderPrintableDocumentHtml(request.document, format);
      const fileName = `${base}.html`;
      const url = downloadBlob(new Blob([html], { type: 'text/html' }), fileName);
      return {
        ok: true,
        message: 'PDF stub: downloaded HTML — wire SalesBillPdfExporter for real PDF.',
        fileName,
        mimeType: 'text/html',
        downloadUrl: url,
      };
    }

    if (request.target === 'print_preview') {
      return {
        ok: true,
        message: 'Use print provider preview for print_preview target.',
      };
    }

    return { ok: false, message: `Unsupported export target: ${request.target}` };
  },

  async exportList(request: ListExportRequest): Promise<ListExportResult> {
    const columns = request.columns;
    const rows = request.rows;

    if (request.target === 'pdf') {
      const html = buildListPrintHtml(
        request.title,
        `${rows.length} record(s)`,
        columns,
        rows,
      );
      const fileName = timestampedFileName(request.title, 'html');
      const url = downloadTextFile(html, fileName, 'text/html;charset=utf-8');
      return {
        ok: true,
        message: `List preview saved as ${fileName}.`,
        fileName,
        downloadUrl: url,
      };
    }

    const outcome =
      request.target === 'csv'
        ? exportListToCsv(request.title, columns, rows)
        : exportListToExcelCsv(request.title, columns, rows);

    return {
      ok: true,
      message: `Exported ${outcome.fileName} (${rows.length} row(s)).`,
      fileName: outcome.fileName,
      downloadUrl: outcome.downloadUrl,
    };
  },
};
